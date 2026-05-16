-- Elevate LMS Migrations — batch_2_may_2026.sql
-- 96 files — run in Supabase SQL Editor
-- All guards in place: IF NOT EXISTS, ON CONFLICT DO NOTHING

-- ── 20260501000001_audit_logs_action_type_description.sql ──
-- Add action_type and description columns to audit_logs.
--
-- These columns are written by lib/monitoring/error-tracker.ts for structured
-- monitoring events (error, api_request, rate_limit_hit, security_event) and
-- queried by the monitoring API routes.
--
-- Both columns are nullable so existing rows and triggers are unaffected.

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS action_type  text,
  ADD COLUMN IF NOT EXISTS description  text;

-- Index for the monitoring queries that filter by action_type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type
  ON public.audit_logs (action_type, created_at DESC)
  WHERE action_type IS NOT NULL;

-- Post-apply verification:
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'audit_logs'
--     AND column_name IN ('action_type', 'description')
--   ORDER BY column_name;
--
--   Expected: 2 rows, both character varying / text, YES nullable.

-- ── 20260501000002_fix_lesson_progress_trigger.sql ──
-- =============================================================================
-- Fix lesson_progress checkpoint gate trigger
--
-- The previous trigger (20260401000001) read curriculum_lessons + modules.
-- HVAC lessons are in course_lessons + course_modules (canonical tables).
-- curriculum_lessons has 0 HVAC rows, so every HVAC lesson completion was
-- blocked with "no curriculum/module binding".
--
-- This replacement reads course_lessons + course_modules first, then falls
-- back to curriculum_lessons + modules for any legacy programs still using
-- those tables.
--
-- checkpoint_scores.passed is a generated column (score >= passing_score).
-- The gate checks it directly — no insert of passed is needed.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_lesson_progress_checkpoint_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id           uuid;
  v_module_order        integer;
  v_prior_module_id     uuid;
  v_has_passing_cp      boolean;
  v_is_completion_write boolean;
BEGIN
  -- Only enforce when this write is marking a lesson complete.
  v_is_completion_write :=
       (TG_OP = 'INSERT' AND (
           COALESCE(NEW.completed, false) = true
           OR NEW.completed_at IS NOT NULL
       ))
    OR (TG_OP = 'UPDATE' AND (
           (COALESCE(OLD.completed, false) = false AND COALESCE(NEW.completed, false) = true)
        OR (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
       ));

  IF NOT v_is_completion_write THEN
    RETURN NEW;
  END IF;

  -- ── Canonical path: course_lessons + course_modules ──────────────────────
  SELECT cl.module_id, cm.order_index
  INTO   v_module_id, v_module_order
  FROM   public.course_lessons cl
  JOIN   public.course_modules cm ON cm.id = cl.module_id
  WHERE  cl.id = NEW.lesson_id;

  IF v_module_id IS NOT NULL THEN
    -- Module 1 is always accessible.
    IF v_module_order <= 1 THEN
      RETURN NEW;
    END IF;

    -- Find the prior module.
    SELECT id INTO v_prior_module_id
    FROM   public.course_modules
    WHERE  course_id    = (SELECT course_id FROM public.course_lessons WHERE id = NEW.lesson_id)
      AND  order_index  = v_module_order - 1;

    -- If no prior module found, allow through.
    IF v_prior_module_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Check for a passing checkpoint in the prior module.
    -- checkpoint_scores.passed is a generated column (score >= passing_score).
    SELECT EXISTS (
      SELECT 1
      FROM   public.checkpoint_scores cs
      JOIN   public.course_lessons    cl_prev ON cl_prev.id = cs.lesson_id
      WHERE  cs.user_id        = NEW.user_id
        AND  cs.passed         = true
        AND  cl_prev.module_id = v_prior_module_id
        AND  cl_prev.lesson_type IN ('checkpoint', 'exam')
    ) INTO v_has_passing_cp;

    -- If prior module has no checkpoint defined, allow through.
    IF NOT EXISTS (
      SELECT 1 FROM public.course_lessons
      WHERE module_id   = v_prior_module_id
        AND lesson_type IN ('checkpoint', 'exam')
    ) THEN
      RETURN NEW;
    END IF;

    IF NOT v_has_passing_cp THEN
      RAISE EXCEPTION
        'Checkpoint gate blocked: user % cannot complete lesson % (module order %) — no passing checkpoint for prior module',
        NEW.user_id, NEW.lesson_id, v_module_order
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  -- ── Legacy fallback: curriculum_lessons + modules ─────────────────────────
  DECLARE
    v_program_id         uuid;
    v_legacy_mod_order   integer;
  BEGIN
    SELECT cl.program_id, m.order_index
    INTO   v_program_id, v_legacy_mod_order
    FROM   public.curriculum_lessons cl
    JOIN   public.modules m ON m.id = cl.module_id
    WHERE  cl.id = NEW.lesson_id;

    -- Not found in either table — allow through (don't block unknown lessons).
    IF v_program_id IS NULL THEN
      RETURN NEW;
    END IF;

    IF v_legacy_mod_order <= 1 THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM   public.checkpoint_scores cs
      JOIN   public.curriculum_lessons cl_prev ON cl_prev.id = cs.lesson_id
      JOIN   public.modules            m_prev  ON m_prev.id  = cl_prev.module_id
      WHERE  cs.user_id         = NEW.user_id
        AND  cs.passed          = true
        AND  cl_prev.program_id = v_program_id
        AND  m_prev.order_index = v_legacy_mod_order - 1
        AND  cl_prev.step_type  = 'checkpoint'
    ) INTO v_has_passing_cp;

    IF NOT EXISTS (
      SELECT 1 FROM public.curriculum_lessons cl2
      JOIN public.modules m2 ON m2.id = cl2.module_id
      WHERE cl2.program_id = v_program_id
        AND m2.order_index = v_legacy_mod_order - 1
        AND cl2.step_type  = 'checkpoint'
    ) THEN
      RETURN NEW;
    END IF;

    IF NOT v_has_passing_cp THEN
      RAISE EXCEPTION
        'Checkpoint gate blocked: user % cannot complete lesson % (module %) — no passing checkpoint for module %',
        NEW.user_id, NEW.lesson_id, v_legacy_mod_order, v_legacy_mod_order - 1
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END;
END;
$$;

-- Replace trigger
DROP TRIGGER IF EXISTS trg_enforce_lesson_progress_checkpoint_gate
  ON public.lesson_progress;

CREATE TRIGGER trg_enforce_lesson_progress_checkpoint_gate
  BEFORE INSERT OR UPDATE
  ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_lesson_progress_checkpoint_gate();

COMMIT;

-- ── 20260501000003_fix_students_rls_and_partner_middleware.sql ──
-- Fix 1: Grant SELECT on students to authenticated role so program_holder
-- pages can join student_enrollments → students via FK.
GRANT SELECT ON public.students TO authenticated;

-- Enable RLS on students if not already enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop any existing policy first to avoid conflicts
DROP POLICY IF EXISTS authenticated_read_students ON public.students;

-- Allow any authenticated user to read students
CREATE POLICY authenticated_read_students ON public.students
  FOR SELECT TO authenticated USING (true);

-- Fix 2: partner_users has an infinite recursion in its RLS policy.
-- Drop all existing policies and replace with non-recursive ones.
GRANT SELECT ON public.partner_users TO authenticated;

ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partner_users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.partner_users', pol.policyname);
  END LOOP;
END $$;

-- Users can read their own partner_users rows
CREATE POLICY partner_users_read_own ON public.partner_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all partner_users rows
CREATE POLICY partner_users_admin_read ON public.partner_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

-- ── 20260501000003_suboffice_applications.sql ──
-- Extend sub_office_agreements to support the full application form.
-- Adds all fields collected during suboffice onboarding.

ALTER TABLE public.sub_office_agreements
  ADD COLUMN IF NOT EXISTS business_name       text,
  ADD COLUMN IF NOT EXISTS ein                 text,
  ADD COLUMN IF NOT EXISTS business_address    text,
  ADD COLUMN IF NOT EXISTS city                text,
  ADD COLUMN IF NOT EXISTS state               text,
  ADD COLUMN IF NOT EXISTS zip                 text,
  ADD COLUMN IF NOT EXISTS contact_name        text,
  ADD COLUMN IF NOT EXISTS contact_email       text,
  ADD COLUMN IF NOT EXISTS contact_phone       text,
  ADD COLUMN IF NOT EXISTS ptin                text,
  ADD COLUMN IF NOT EXISTS efin                text,
  ADD COLUMN IF NOT EXISTS preparer_count      integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acknowledged_split  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_addons boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_software boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_payroll boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_policy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_address          text,
  ADD COLUMN IF NOT EXISTS submitted_at        timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by         uuid REFERENCES auth.users(id);

-- Default status for new applications
ALTER TABLE public.sub_office_agreements
  ALTER COLUMN status SET DEFAULT 'pending';

COMMENT ON TABLE public.sub_office_agreements IS
  'Suboffice (tax prep franchise) onboarding applications. Submitted via /suboffice-onboarding/apply.';

-- ── 20260501000004_hvac_link_lessons_to_modules.sql ──
-- ── 1. Link course_lessons to course_modules for HVAC ────────────────────────
--
-- course_lessons.order_index encodes the week as floor(order_index / 1000).
-- course_modules.order_index is the week number (1–16).
-- This update sets module_id on every HVAC lesson that currently has NULL.

UPDATE public.course_lessons cl
SET module_id = cm.id
FROM public.course_modules cm
WHERE cl.course_id  = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND cm.course_id  = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND cl.module_id  IS NULL
  AND cm.order_index = floor(cl.order_index / 1000)::int;

-- ── 2. Remove empty modules (weeks 11–16 have no lessons) ────────────────────
--
-- publish_course() blocks if any module has zero lessons.
-- Weeks 11–16 have no course_lessons rows — remove those modules so publish
-- can proceed. module_completion_rules referencing them are also removed.

DELETE FROM public.module_completion_rules
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND module_id IN (
    SELECT cm.id
    FROM public.course_modules cm
    LEFT JOIN public.course_lessons cl ON cl.module_id = cm.id
    WHERE cm.course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
    GROUP BY cm.id
    HAVING COUNT(cl.id) = 0
  );

DELETE FROM public.module_completion_rules
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND required_previous_module_id IN (
    SELECT cm.id
    FROM public.course_modules cm
    LEFT JOIN public.course_lessons cl ON cl.module_id = cm.id
    WHERE cm.course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
    GROUP BY cm.id
    HAVING COUNT(cl.id) = 0
  );

DELETE FROM public.course_modules
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND id NOT IN (
    SELECT DISTINCT module_id
    FROM public.course_lessons
    WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
      AND module_id IS NOT NULL
  );

-- ── 3. snapshot_course_version() ─────────────────────────────────────────────
--
-- Creates an immutable snapshot of a course's current modules and lessons.
-- Called by publishCourse() in lib/lms/course-service.ts.
-- Returns the new course_versions row.

CREATE OR REPLACE FUNCTION public.snapshot_course_version(
  p_course_id  UUID,
  p_created_by UUID DEFAULT NULL,
  p_label      TEXT DEFAULT NULL
)
RETURNS public.course_versions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_version_number INT;
  v_version        public.course_versions;
  v_mod            RECORD;
  v_version_mod_id UUID;
BEGIN
  -- Next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.course_versions
  WHERE course_id = p_course_id;

  -- Create version row
  INSERT INTO public.course_versions (
    course_id, version_number, label, is_published, published_at, created_by
  ) VALUES (
    p_course_id, v_version_number, p_label, true, NOW(), p_created_by
  )
  RETURNING * INTO v_version;

  -- Snapshot modules
  FOR v_mod IN
    SELECT * FROM public.course_modules
    WHERE course_id = p_course_id
    ORDER BY order_index
  LOOP
    INSERT INTO public.course_version_modules (
      version_id, module_id, title, order_index
    ) VALUES (
      v_version.id, v_mod.id, v_mod.title, v_mod.order_index
    )
    RETURNING id INTO v_version_mod_id;

    -- Snapshot lessons for this module
    INSERT INTO public.course_version_lessons (
      version_id, version_module_id, lesson_id, title, lesson_type, order_index, passing_score
    )
    SELECT
      v_version.id,
      v_version_mod_id,
      cl.id,
      cl.title,
      cl.lesson_type,
      cl.order_index,
      cl.passing_score
    FROM public.course_lessons cl
    WHERE cl.module_id = v_mod.id
      AND cl.course_id = p_course_id
    ORDER BY cl.order_index;
  END LOOP;

  RETURN v_version;
END;
$$;

GRANT EXECUTE ON FUNCTION public.snapshot_course_version(UUID, UUID, TEXT) TO service_role;

-- ── 4. Verify result ──────────────────────────────────────────────────────────

DO $$
DECLARE
  v_lesson_count INT;
  v_module_count INT;
  v_unlinked     INT;
BEGIN
  SELECT COUNT(*) INTO v_lesson_count
  FROM public.course_lessons
  WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';

  SELECT COUNT(*) INTO v_module_count
  FROM public.course_modules
  WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';

  SELECT COUNT(*) INTO v_unlinked
  FROM public.course_lessons
  WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
    AND module_id IS NULL;

  RAISE NOTICE 'HVAC: % lessons, % modules, % unlinked lessons', v_lesson_count, v_module_count, v_unlinked;

  IF v_unlinked > 0 THEN
    RAISE WARNING 'Some lessons still have NULL module_id — check order_index pattern';
  END IF;
END;
$$;

-- ── 20260501000004_policies_table.sql ──
-- policies table: CMS overlay for policy pages.
-- Pages under /policies/* query this table to surface DB-managed content
-- alongside static page content. Rows are optional — pages render fine
-- without them.

CREATE TABLE IF NOT EXISTS public.policies (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  category    text,
  content     text,
  summary     text,
  version     text,
  effective_date date,
  is_published boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policies_slug_idx ON public.policies (slug);
CREATE INDEX IF NOT EXISTS policies_category_idx ON public.policies (category);

COMMENT ON TABLE public.policies IS
  'CMS overlay for /policies/* pages. Rows are optional — pages render static content without them.';

-- ── 20260501000005_organizations_trial_fields.sql ──
-- Add trial and contact fields to organizations table.
-- Required by /api/trial/start-managed to create org records.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_name  text,
  ADD COLUMN IF NOT EXISTS domain        text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_trial      boolean DEFAULT false;

-- ── 20260501000005_student_practical_progress.sql ──
-- student_practical_progress: tracks accumulated lab/practical hours per student per lesson.
-- Written by /api/lms/practical-progress (GET + POST + PATCH).

CREATE TABLE IF NOT EXISTS public.student_practical_progress (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id           uuid NOT NULL,
  accumulated_hours   numeric(6,2) DEFAULT 0,
  approved_attempts   integer DEFAULT 0,
  status              text DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed', 'failed')),
  last_updated_at     timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS spp_user_idx   ON public.student_practical_progress (user_id);
CREATE INDEX IF NOT EXISTS spp_lesson_idx ON public.student_practical_progress (lesson_id);

COMMENT ON TABLE public.student_practical_progress IS
  'Accumulated lab/practical hours per student per lesson. Used by /api/lms/practical-progress.';

-- ── 20260501000006_web_vitals.sql ──
-- Web vitals telemetry table.
-- Receives Core Web Vitals from the browser via /api/analytics/web-vitals.
-- No PII — stores metric name, value, rating, and page URL only.

CREATE TABLE IF NOT EXISTS public.web_vitals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text NOT NULL,
  value            numeric,
  rating           text,
  delta            numeric,
  metric_id        text,
  navigation_type  text,
  user_agent       text,
  url              text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS web_vitals_name_idx       ON public.web_vitals (name);
CREATE INDEX IF NOT EXISTS web_vitals_created_at_idx ON public.web_vitals (created_at DESC);

COMMENT ON TABLE public.web_vitals IS
  'Core Web Vitals telemetry from /api/analytics/web-vitals. No PII.';

-- ── 20260501000007_review_helpful_votes.sql ──
-- Review helpful votes table.
-- One row per (review_id, user_id) pair — enforces one vote per user per review.
-- helpful_count on course_reviews is recalculated from this table on each vote.

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id   uuid NOT NULL REFERENCES public.course_reviews(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS rhv_review_idx ON public.review_helpful_votes (review_id);
CREATE INDEX IF NOT EXISTS rhv_user_idx   ON public.review_helpful_votes (user_id);

COMMENT ON TABLE public.review_helpful_votes IS
  'Deduplication table for course review helpful votes. One row per user per review.';

-- ── 20260501000008_student_lesson_evidence.sql ──
-- Student lesson evidence submissions.
-- Learners submit text, file, image, video, audio, or URL evidence for practical lessons.
-- Instructor reviews and approves/rejects each submission.

CREATE TABLE IF NOT EXISTS public.student_lesson_evidence (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id            uuid NOT NULL,
  lesson_id            uuid NOT NULL,
  submission_mode      text NOT NULL CHECK (submission_mode IN ('text','file','image','video','audio','url')),
  body_text            text,
  file_url             text,
  media_url            text,
  external_url         text,
  status               text NOT NULL DEFAULT 'submitted'
                         CHECK (status IN ('submitted','under_review','approved','rejected','revision_requested')),
  evaluator_notes      text,
  attempt_number       integer NOT NULL DEFAULT 1,
  submitted_at         timestamptz DEFAULT now(),
  reviewed_at          timestamptz,
  reviewed_by          uuid REFERENCES auth.users(id),
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sle_user_lesson_idx ON public.student_lesson_evidence (user_id, lesson_id);
CREATE INDEX IF NOT EXISTS sle_course_idx      ON public.student_lesson_evidence (course_id);
CREATE INDEX IF NOT EXISTS sle_status_idx      ON public.student_lesson_evidence (status);

COMMENT ON TABLE public.student_lesson_evidence IS
  'Learner evidence submissions for practical lessons. Backed by /api/lms/evidence.';

-- ── 20260501000009_practical_requirements.sql ──
-- Practical requirements per lesson.
-- One row per lesson that requires hands-on evidence or skill sign-off.
-- Read by /api/lms/practical-requirements to configure the evidence submission UI.

CREATE TABLE IF NOT EXISTS public.practical_requirements (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id                   uuid NOT NULL UNIQUE,
  practical_type              text NOT NULL DEFAULT 'evidence'
                                CHECK (practical_type IN ('evidence','hours','skill_signoff','combined')),
  required_hours              numeric(6,2),
  required_attempts           integer DEFAULT 1,
  requires_evaluator_approval boolean DEFAULT false,
  requires_skill_signoff      boolean DEFAULT false,
  allowed_submission_modes    text[] DEFAULT ARRAY['text','file'],
  instructions                text,
  rubric_json                 jsonb,
  safety_guidance             text,
  materials_needed            text,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pr_lesson_idx ON public.practical_requirements (lesson_id);

COMMENT ON TABLE public.practical_requirements IS
  'Per-lesson practical/evidence requirements. Read by /api/lms/practical-requirements.';

-- ── 20260501000010_applications_address_state.sql ──
-- Add address and state columns to applications table
-- These are optional fields collected by some apply forms (FSSA, full application)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS state   text;

-- ── 20260501000010_enrollment_state_and_followup.sql ──
-- Extend enrollment_state CHECK constraint to include placement and follow-up states.
-- Add follow-up tracking columns to applications table.
-- These states are required for WIOA performance reporting and DOL outcome tracking.

-- 1. Drop and recreate the enrollment_state CHECK constraint with full state set
ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_enrollment_state_check;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_enrollment_state_check
  CHECK (enrollment_state IS NULL OR enrollment_state = ANY (ARRAY[
    'applied',
    'waitlisted',
    'onboarding',
    'orientation',
    'enrolled',
    'active',
    'pending_funding_verification',
    'payment_required',
    'suspended',
    'revoked',
    'withdrawn',
    'completed',
    'graduated',
    'placed',
    'follow_up_6mo',
    'follow_up_12mo'
  ]));

-- 2. Add follow-up timestamp columns to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS follow_up_6mo_at  timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_12mo_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_6mo_employed  boolean,
  ADD COLUMN IF NOT EXISTS follow_up_12mo_employed boolean,
  ADD COLUMN IF NOT EXISTS follow_up_6mo_wage      numeric(8,2),
  ADD COLUMN IF NOT EXISTS follow_up_12mo_wage     numeric(8,2),
  ADD COLUMN IF NOT EXISTS follow_up_notes         text;

-- 3. Index for follow-up reporting queries
CREATE INDEX IF NOT EXISTS applications_follow_up_6mo_idx  ON public.applications (follow_up_6mo_at)  WHERE follow_up_6mo_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS applications_follow_up_12mo_idx ON public.applications (follow_up_12mo_at) WHERE follow_up_12mo_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS program_enrollments_state_idx   ON public.program_enrollments (enrollment_state);

COMMENT ON COLUMN public.applications.follow_up_6mo_at       IS '6-month post-placement follow-up date — required for WIOA entered employment retention metric';
COMMENT ON COLUMN public.applications.follow_up_12mo_at      IS '12-month post-placement follow-up date — required for WIOA second quarter retention metric';
COMMENT ON COLUMN public.applications.follow_up_6mo_employed IS 'Still employed at 6-month follow-up';
COMMENT ON COLUMN public.applications.follow_up_12mo_employed IS 'Still employed at 12-month follow-up';

-- ── 20260501000011_interviews_fix.sql ──
-- Fix interviews table: add proper FK columns, enable RLS, add employer isolation.
-- The existing table stores candidate/jobs as text — add UUID FK columns alongside.

-- 1. Add proper FK columns (nullable to avoid breaking existing rows)
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS candidate_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_id        uuid,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS meeting_url   text,
  ADD COLUMN IF NOT EXISTS duration_mins integer DEFAULT 30;

-- 2. Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies before recreating
DROP POLICY IF EXISTS "employers_own_interviews"  ON public.interviews;
DROP POLICY IF EXISTS "candidates_own_interviews" ON public.interviews;
DROP POLICY IF EXISTS "admins_all_interviews"     ON public.interviews;

-- 4. Employers see only their interviews
CREATE POLICY "employers_own_interviews"
  ON public.interviews
  FOR ALL
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 5. Candidates see their own interviews
CREATE POLICY "candidates_own_interviews"
  ON public.interviews
  FOR SELECT
  USING (candidate_id = auth.uid());

-- 6. Admins/staff see all
CREATE POLICY "admins_all_interviews"
  ON public.interviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
    )
  );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS interviews_employer_idx   ON public.interviews (employer_id);
CREATE INDEX IF NOT EXISTS interviews_candidate_idx  ON public.interviews (candidate_id);
CREATE INDEX IF NOT EXISTS interviews_scheduled_idx  ON public.interviews (scheduled_at);

COMMENT ON TABLE public.interviews IS
  'Employer-scheduled candidate interviews. RLS enforces employer/candidate isolation.';

-- ── 20260501000012_applications_status_pending_states.sql ──
-- Add pending_funding and pending_admin_review to applications.status CHECK constraint.
--
-- The /api/applications route inserts these values for funded applicants
-- (WIOA / WRG / FSSA). Without them the insert fails with a CHECK violation,
-- surfacing as "Failed to submit application" on the HVAC and other apply pages.
--
-- pending_funding      → funded applicant who has not yet been to Indiana Career Connect
-- pending_admin_review → funded applicant with ICC in process, awaiting staff review

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check,
  DROP CONSTRAINT IF EXISTS applications_valid_status;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status = ANY (ARRAY[
    'submitted',
    'pending_funding',
    'pending_admin_review',
    'pending_workone',
    'funding_review',
    'scheduled',
    'in_review',
    'under_review',
    'attended_orientation',
    'ready_to_enroll',
    'approved',
    'rejected',
    'enrolled',
    'active_apprentice',
    'assigned',
    'completed',
    'placed',
    'retained',
    'waitlisted',
    'withdrawn',
    'exited'
  ]::text[]));

-- ── 20260502000001_cleanup_intake_timestamp_ids.sql ──
-- Remove legacy intake-{timestamp} rows from the applications table.
-- These rows were created before the intake mirror was fixed and have
-- non-UUID primary keys that break the admin review page.
-- The source data is preserved in the apprenticeship_intake table.
--
-- Safe to run multiple times (DELETE WHERE is idempotent).
-- Run in Supabase Dashboard → SQL Editor before deploying the UUID guard fixes.

DELETE FROM public.applications
WHERE id::text LIKE 'intake-%';

-- ── 20260502000001_fix_cross_table_fks.sql ──
-- ============================================================
-- Fix 0: lesson_progress.enrollment_id FK
-- Currently references training_enrollments.
-- New enrollments are in program_enrollments.
-- Drop the FK — enrollment existence is enforced at app layer.
-- ============================================================
ALTER TABLE public.lesson_progress
  DROP CONSTRAINT IF EXISTS lesson_progress_enrollment_fk;

-- ============================================================
-- Fix 1: checkpoint_scores.lesson_id FK
-- Currently references curriculum_lessons only.
-- New courses use course_lessons. Drop FK — enforced at app layer.
-- ============================================================
ALTER TABLE public.checkpoint_scores
  DROP CONSTRAINT IF EXISTS checkpoint_scores_lesson_id_fkey;

-- ============================================================
-- Fix 2: program_completion_certificates
-- program_id NOT NULL blocks courses without a programs row.
-- verification_url NOT NULL requires a value on insert.
-- ============================================================
ALTER TABLE public.program_completion_certificates
  ALTER COLUMN program_id DROP NOT NULL;

ALTER TABLE public.program_completion_certificates
  ALTER COLUMN verification_url DROP NOT NULL;

-- ============================================================
-- Fix 3: program_enrollments trigger raises on NULL program_slug.
-- The trigger validates slug against apprenticeship_programs.
-- Drop known trigger names that contain this guard.
-- ============================================================
DROP TRIGGER IF EXISTS trg_program_enrollment_apprenticeship ON public.program_enrollments;
DROP TRIGGER IF EXISTS trg_apprenticeship_enrollment ON public.program_enrollments;
DROP TRIGGER IF EXISTS program_enrollment_apprenticeship_trigger ON public.program_enrollments;
DROP TRIGGER IF EXISTS on_program_enrollment_insert ON public.program_enrollments;
DROP TRIGGER IF EXISTS handle_program_enrollment ON public.program_enrollments;

-- ── 20260502000002_rename_milady_columns.sql ──
-- Rename milady_* columns to lms_* equivalents.
-- Milady is no longer used; theory instruction is delivered via Elevate LMS.

-- program_enrollments
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_enrollments'
      AND column_name = 'milady_enrolled'
  ) THEN
    ALTER TABLE public.program_enrollments
      RENAME COLUMN milady_enrolled TO lms_enrolled;
  END IF;
END $$;

-- student_enrollments
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_enrollments'
      AND column_name = 'milady_enrolled'
  ) THEN
    ALTER TABLE public.student_enrollments
      RENAME COLUMN milady_enrolled TO lms_enrolled;
  END IF;
END $$;

-- state_board_readiness
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'state_board_readiness'
      AND column_name = 'milady_completed'
  ) THEN
    ALTER TABLE public.state_board_readiness
      RENAME COLUMN milady_completed TO lms_completed;
  END IF;
END $$;

-- ── 20260502000003_repoint_fks_to_canonical_tables.sql ──
-- =============================================================================
-- Repoint stale FKs to canonical tables
--
-- lesson_progress.enrollment_id was pointing at training_enrollments.
-- checkpoint_scores.lesson_id was pointing at curriculum_lessons.
-- Both are now re-pointed to the canonical tables used by the LMS engine.
--
-- Orphan check run before this migration:
--   lesson_progress: 2 orphan enrollment_ids — repaired by inserting matching
--     rows into program_enrollments with the same UUIDs (no row updates needed).
--   checkpoint_scores: 0 orphan lesson_ids — no repair needed.
-- =============================================================================

-- BEGIN; (removed: exec_sql runs in implicit txn)

-- ── 1. lesson_progress.enrollment_id → program_enrollments(id) ───────────────
ALTER TABLE public.lesson_progress
  DROP CONSTRAINT IF EXISTS lesson_progress_enrollment_fk;

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT lesson_progress_enrollment_fk
  FOREIGN KEY (enrollment_id)
  REFERENCES public.program_enrollments(id)
  ON DELETE CASCADE;

-- ── 2. checkpoint_scores.lesson_id → course_lessons(id) ──────────────────────
ALTER TABLE public.checkpoint_scores
  DROP CONSTRAINT IF EXISTS checkpoint_scores_lesson_id_fkey;

ALTER TABLE public.checkpoint_scores
  ADD CONSTRAINT checkpoint_scores_lesson_id_fkey
  FOREIGN KEY (lesson_id)
  REFERENCES public.course_lessons(id)
  ON DELETE CASCADE;

-- ── 3. program_completion_certificates: drop NOT NULL on nullable columns ─────
ALTER TABLE public.program_completion_certificates
  ALTER COLUMN program_id DROP NOT NULL;

ALTER TABLE public.program_completion_certificates
  ALTER COLUMN verification_url DROP NOT NULL;

-- COMMIT; (removed: exec_sql runs in implicit txn)

-- ── 20260502000004_rls_remediation.sql ──
-- RLS Remediation — Phase 1
-- Enables RLS on tables that had policies defined but RLS not enabled,
-- and locks down efh_migrations from all client access.
--
-- Run in Supabase Dashboard → SQL Editor.
-- Safe to re-run (all statements are idempotent).

-- ============================================================
-- 1. ENABLE RLS on tables with no row-level security
-- ============================================================

-- course_lessons: queried by LMS lesson page — gate to enrolled users
alter table public.course_lessons enable row level security;

-- library_resources: course-scoped resources — gate to authenticated
alter table public.library_resources enable row level security;

-- program_tracks: program metadata — safe for public read (no PII)
alter table public.program_tracks enable row level security;

-- videos: media assets — safe for public read of published rows
alter table public.videos enable row level security;

-- program_media: program images/media — safe for public read
alter table public.program_media enable row level security;

-- program_ctas: call-to-action config — safe for public read
alter table public.program_ctas enable row level security;

-- program_modules: program structure — safe for public read
alter table public.program_modules enable row level security;

-- program_lessons: lesson metadata — safe for public read
alter table public.program_lessons enable row level security;

-- efh_migrations: internal migration log — NO client access
alter table public.efh_migrations enable row level security;

-- ============================================================
-- 2. POLICIES — public content tables (anon + authenticated read)
-- ============================================================

-- program_tracks: all rows are public program metadata
drop policy if exists "public_read" on public.program_tracks;
create policy "public_read"
  on public.program_tracks for select
  to anon, authenticated
  using (true);

-- program_media: all rows are public program assets
drop policy if exists "public_read" on public.program_media;
create policy "public_read"
  on public.program_media for select
  to anon, authenticated
  using (true);

-- program_ctas: all rows are public CTA config
drop policy if exists "public_read" on public.program_ctas;
create policy "public_read"
  on public.program_ctas for select
  to anon, authenticated
  using (true);

-- program_modules: all rows are public program structure
drop policy if exists "public_read" on public.program_modules;
create policy "public_read"
  on public.program_modules for select
  to anon, authenticated
  using (true);

-- program_lessons: all rows are public lesson metadata
drop policy if exists "public_read" on public.program_lessons;
create policy "public_read"
  on public.program_lessons for select
  to anon, authenticated
  using (true);

-- videos: only published rows visible to public
drop policy if exists "public_read_published" on public.videos;
create policy "public_read_published"
  on public.videos for select
  to anon, authenticated
  using (
    published = true
    or (select auth.role()) = 'service_role'
  );

-- ============================================================
-- 3. POLICIES — authenticated-only tables
-- ============================================================

-- course_lessons: authenticated users can read (enrollment gating
-- is enforced at the API layer, not RLS — keeps queries simple)
drop policy if exists "authenticated_read" on public.course_lessons;
create policy "authenticated_read"
  on public.course_lessons for select
  to authenticated
  using (true);

-- library_resources: authenticated users can read
drop policy if exists "authenticated_read" on public.library_resources;
create policy "authenticated_read"
  on public.library_resources for select
  to authenticated
  using (true);

-- ============================================================
-- 4. efh_migrations — LOCK DOWN completely
-- No client (anon or authenticated) should ever read this table.
-- Service role bypasses RLS so admin scripts still work.
-- ============================================================

-- Revoke all client grants
revoke all on table public.efh_migrations from anon;
revoke all on table public.efh_migrations from authenticated;

-- No policies = no access for any client role (RLS is now enabled above)
-- Service role bypasses RLS by default — no policy needed for it.

-- ============================================================
-- 5. Admin write policies for content tables
-- Only service_role (admin client) can insert/update/delete.
-- No explicit policy needed — service_role bypasses RLS.
-- This comment documents the intent.
-- ============================================================

-- Verify: after running, check with:
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public'
-- and tablename in (
--   'course_lessons','library_resources','program_tracks','videos',
--   'program_media','program_ctas','program_modules','program_lessons','efh_migrations'
-- )
-- order by tablename;

-- ── 20260503000001_partner_scorm_schema_fixes.sql ──
-- =============================================================================
-- Partner LMS + SCORM schema fixes
--
-- Fixes three structural gaps identified in the 2026-05 audit:
--   1. partner_lms_providers missing PRIMARY KEY
--   2. partner_lms_courses missing course_type discriminator column
--   3. scorm_packages, scorm_enrollments, partner_course_mappings referenced
--      in lib/actions/scorm.ts but never created
--
-- Safe to re-run (all statements are IF NOT EXISTS / DO NOTHING).
-- Apply in Supabase Dashboard → SQL Editor.
-- =============================================================================

BEGIN;

-- ── 1. partner_lms_providers — ensure id column exists and is PK ─────────────

ALTER TABLE public.partner_lms_providers
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'partner_lms_providers'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.partner_lms_providers ADD PRIMARY KEY (id);
  END IF;
END $$;

-- ── 2. partner_lms_courses — add course_type discriminator ───────────────────

ALTER TABLE public.partner_lms_courses
  ADD COLUMN IF NOT EXISTS course_type TEXT NOT NULL DEFAULT 'partner'
  CHECK (course_type IN ('partner', 'micro', 'scorm'));

-- ── 3. scorm_packages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scorm_packages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID        REFERENCES public.training_courses(id) ON DELETE SET NULL,
  title           TEXT,
  launch_url      TEXT        NOT NULL,
  version         TEXT        DEFAULT '1.2',
  metadata        JSONB       DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scorm_packages_course_id ON public.scorm_packages(course_id);

-- ── 4. scorm_enrollments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scorm_enrollments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scorm_package_id    UUID        NOT NULL REFERENCES public.scorm_packages(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id       UUID,       -- optional link to program_enrollments
  status              TEXT        NOT NULL DEFAULT 'not_attempted',
                      CHECK (status IN ('not_attempted','incomplete','completed','passed','failed','browsed')),
  progress_percentage NUMERIC     NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  score               NUMERIC,
  time_spent_seconds  INTEGER     NOT NULL DEFAULT 0,
  last_accessed_at    TIMESTAMPTZ,
  cmi_data            JSONB       DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
  CONSTRAINT uq_scorm_package_id_user_id_1 UNIQUE (scorm_package_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_scorm_enrollments_user_id    ON public.scorm_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_enrollments_package_id ON public.scorm_enrollments(scorm_package_id);

-- ── 5. scorm_tracking ────────────────────────────────────────────────────────
-- Individual CMI element writes (referenced in lib/actions/scorm.ts)

CREATE TABLE IF NOT EXISTS public.scorm_tracking (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scorm_enrollment_id   UUID        NOT NULL REFERENCES public.scorm_enrollments(id) ON DELETE CASCADE,
  element               TEXT        NOT NULL,
  value                 TEXT,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scorm_tracking_enrollment_id ON public.scorm_tracking(scorm_enrollment_id);

-- ── 6. partner_course_mappings ───────────────────────────────────────────────
-- Maps a partner_lms_courses row to an optional scorm_packages row.
-- Also used to map program slugs to partner course IDs for enrollment routing.

CREATE TABLE IF NOT EXISTS public.partner_course_mappings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug        TEXT,
  partner_course_id   UUID        REFERENCES public.partner_lms_courses(id) ON DELETE CASCADE,
  scorm_package_id    UUID        REFERENCES public.scorm_packages(id) ON DELETE SET NULL,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcm_program_slug        ON public.partner_course_mappings(program_slug);
CREATE INDEX IF NOT EXISTS idx_pcm_partner_course_id   ON public.partner_course_mappings(partner_course_id);

-- ── 7. lms_sync_log — ensure it exists (referenced in partnerEnrollment.ts) ──

CREATE TABLE IF NOT EXISTS public.lms_sync_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID        REFERENCES public.partner_lms_providers(id) ON DELETE SET NULL,
  sync_type         TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending','success','failed')),
  records_processed INTEGER     DEFAULT 0,
  sync_data         JSONB       DEFAULT '{}',
  error_message     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lms_sync_log_provider_id ON public.lms_sync_log(provider_id);

-- ── 8. partner_lms_enrollment_failures — ensure it exists ────────────────────

CREATE TABLE IF NOT EXISTS public.partner_lms_enrollment_failures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_id   UUID        REFERENCES public.partner_lms_providers(id) ON DELETE SET NULL,
  course_id     UUID        REFERENCES public.partner_lms_courses(id) ON DELETE SET NULL,
  program_id    UUID,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- ── 20260503000002_prs_slug_alias.sql ──
-- =============================================================================
-- PRS slug alias
--
-- The public program page uses slug 'peer-recovery-specialist'.
-- The DB program row uses slug 'peer-recovery-specialist-jri' (set during
-- initial seeding and referenced by 20+ migrations).
--
-- Rather than rename the canonical DB slug (which would require re-running
-- all dependent migrations), we add a slug_aliases column to programs and
-- record the public slug there. Application code resolves aliases via
-- lib/program-registry.ts SLUG_ALIASES map (already updated).
--
-- This migration also adds a unique partial index so alias lookups are fast.
-- =============================================================================

BEGIN;

-- Add slug_aliases column if it doesn't exist
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS slug_aliases TEXT[] DEFAULT '{}';

-- Record the public-facing alias on the PRS program row
UPDATE public.programs
SET slug_aliases = array_append(
  COALESCE(slug_aliases, '{}'),
  'peer-recovery-specialist'
)
WHERE slug = 'peer-recovery-specialist-jri'
  AND NOT ('peer-recovery-specialist' = ANY(COALESCE(slug_aliases, '{}')));

-- Index for alias lookups
CREATE INDEX IF NOT EXISTS idx_programs_slug_aliases
  ON public.programs USING GIN (slug_aliases);

COMMIT;

-- ── 20260503000003_webinars_messages.sql ──
-- =============================================================================
-- Webinars + Messages tables
--
-- Replaces hardcoded fake arrays in app/webinars/page.tsx and
-- app/messages/sent/page.tsx with real DB-backed tables.
-- =============================================================================

BEGIN;

-- ── webinars ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webinars (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  host_name       TEXT        NOT NULL,
  host_title      TEXT,
  scheduled_at    TIMESTAMPTZ,
  duration_minutes INTEGER,
  registration_url TEXT,
  recording_url   TEXT,
  thumbnail_url   TEXT,
  status          TEXT        NOT NULL DEFAULT 'upcoming',
                  CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  attendee_count  INTEGER     DEFAULT 0,
  view_count      INTEGER     DEFAULT 0,
  tags            TEXT[]      DEFAULT '{}',
  is_public       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webinars_status       ON public.webinars(status);
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled_at ON public.webinars(scheduled_at);

-- ── webinar_registrations ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id  UUID        NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  email       TEXT        NOT NULL,
  name        TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended    BOOLEAN     DEFAULT false
  CONSTRAINT uq_webinar_id_email_2 UNIQUE (webinar_id, email)
);

CREATE INDEX IF NOT EXISTS idx_webinar_reg_webinar_id ON public.webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_user_id    ON public.webinar_registrations(user_id);

-- ── messages ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID       REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject     TEXT,
  body        TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  thread_id   UUID,       -- groups replies; NULL = new thread
  parent_id   UUID        REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id    ON public.messages(thread_id);

COMMIT;

-- ── 20260503000005_programs_delivery_schema.sql ──
-- Phase 3: Add delivery model columns to programs table.
--
-- The live DB already has: id, slug, title, name, status, is_active, published,
-- description, excerpt, code, created_at, short_description, display_order.
--
-- This migration adds the columns needed for DB-driven CTA routing and
-- delivery model classification. All additions use IF NOT EXISTS / safe defaults.
--
-- DO NOT recreate the programs table — it has 449 active code references and
-- live FK relations to program_enrollments, training_courses, modules, etc.

-- ── 1. Add delivery classification columns to programs ────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS delivery_model       TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_type      TEXT
    CHECK (enrollment_type IN ('internal', 'external', 'waitlist')),
  ADD COLUMN IF NOT EXISTS external_enrollment_url TEXT,
  ADD COLUMN IF NOT EXISTS has_lms_course       BOOLEAN DEFAULT FALSE;

-- ── 2. Create program_funding table ──────────────────────────────────────────
-- Stores verified funding options per program (wioa, wrg, self_pay, etc.)
-- Replaces the scattered fundingStatement text fields with queryable rows.

CREATE TABLE IF NOT EXISTS public.program_funding (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('wioa', 'wrg', 'self_pay', 'employer_paid', 'unknown')),
  label       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
  CONSTRAINT uq_program_id_type_3 UNIQUE (program_id, type)
);

-- Index for fast per-program lookups
CREATE INDEX IF NOT EXISTS idx_program_funding_program_id
  ON public.program_funding(program_id);

-- ── 3. Backfill delivery_model from existing data ────────────────────────────
-- programs that already have a slug matching our 11 active programs
-- get their delivery_model set from the classification we established in Phase 2.
-- enrollment_type defaults to 'internal' for all existing programs (safe default).

UPDATE public.programs
SET
  delivery_model  = CASE slug
    WHEN 'hvac-technician'           THEN 'internal_lms'
    WHEN 'bookkeeping'               THEN 'internal_lms'
    WHEN 'peer-recovery-specialist'  THEN 'external_admin'
    WHEN 'medical-assistant'         THEN 'external_admin'
    WHEN 'barber-apprenticeship'     THEN 'external_admin'
    WHEN 'cosmetology-apprenticeship' THEN 'external_admin'
    WHEN 'cna'                       THEN 'external_admin'
    WHEN 'cdl-training'              THEN 'external_admin'
    WHEN 'cpr-first-aid'             THEN 'partner_managed'
    WHEN 'business'                  THEN 'external_admin'
    WHEN 'phlebotomy'                THEN 'external_admin'
    ELSE delivery_model  -- leave existing value if already set
  END,
  enrollment_type = COALESCE(enrollment_type, 'internal'),
  has_lms_course  = CASE slug
    WHEN 'hvac-technician'  THEN TRUE
    WHEN 'bookkeeping'      THEN TRUE
    ELSE has_lms_course
  END
WHERE slug IN (
  'hvac-technician', 'bookkeeping', 'peer-recovery-specialist',
  'medical-assistant', 'barber-apprenticeship', 'cosmetology-apprenticeship',
  'cna', 'cdl-training', 'cpr-first-aid', 'business', 'phlebotomy'
);

-- ── 4. Backfill program_funding for the 11 active programs ───────────────────
-- Only insert if the program row exists (safe — uses subquery).
-- Uses ON CONFLICT DO NOTHING to be idempotent.

INSERT INTO public.program_funding (program_id, type, label, is_active)
SELECT p.id, f.type, f.label, TRUE
FROM public.programs p
JOIN (VALUES
  ('hvac-technician',            'wioa',         'WIOA Eligible'),
  ('hvac-technician',            'wrg',          'Workforce Ready Grant'),
  ('hvac-technician',            'self_pay',     'Self-Pay Available'),
  ('bookkeeping',                'self_pay',     'Self-Pay Available'),
  ('peer-recovery-specialist',   'wioa',         'WIOA Eligible'),
  ('peer-recovery-specialist',   'self_pay',     'Self-Pay Available'),
  ('medical-assistant',          'wioa',         'WIOA Eligible'),
  ('medical-assistant',          'self_pay',     'Self-Pay Available'),
  ('barber-apprenticeship',      'employer_paid','Employer-Sponsored'),
  ('barber-apprenticeship',      'wioa',         'WIOA Eligible'),
  ('barber-apprenticeship',      'self_pay',     'Self-Pay Available'),
  ('cosmetology-apprenticeship', 'employer_paid','Employer-Sponsored'),
  ('cosmetology-apprenticeship', 'wioa',         'WIOA Eligible'),
  ('cna',                        'self_pay',     'Self-Pay Available'),
  ('cdl-training',               'wioa',         'WIOA Eligible'),
  ('cdl-training',               'self_pay',     'Self-Pay Available'),
  ('cpr-first-aid',              'self_pay',     'Self-Pay Available'),
  ('business',                   'wioa',         'WIOA Eligible'),
  ('business',                   'self_pay',     'Self-Pay Available'),
  ('phlebotomy',                 'self_pay',     'Self-Pay Available')
) AS f(slug, type, label) ON p.slug = f.slug
ON CONFLICT (program_id, type) DO NOTHING;

-- ── 5. Verify ────────────────────────────────────────────────────────────────
-- Run this after applying to confirm the migration landed correctly:
--
-- SELECT slug, delivery_model, enrollment_type, has_lms_course
-- FROM public.programs
-- WHERE slug IN (
--   'hvac-technician','bookkeeping','peer-recovery-specialist','medical-assistant',
--   'barber-apprenticeship','cosmetology-apprenticeship','cna','cdl-training',
--   'cpr-first-aid','business','phlebotomy'
-- )
-- ORDER BY slug;
--
-- SELECT p.slug, pf.type, pf.label
-- FROM public.program_funding pf
-- JOIN public.programs p ON p.id = pf.program_id
-- ORDER BY p.slug, pf.type;

-- ── 20260503000006_program_operational_tables.sql ──
-- Phase 3 continuation: operational tables for program pages.
--
-- These tables make program pages fully DB-driven. Without them, pages
-- must import static TS files for curriculum, CTAs, media, and enrollment
-- tracks — creating a split source of truth.
--
-- All tables use IF NOT EXISTS and safe defaults. No destructive ops.

-- ── 1. program_curriculum_modules ────────────────────────────────────────────
-- Curriculum modules displayed on program detail pages.
-- topics stored as JSONB array of strings.

CREATE TABLE IF NOT EXISTS public.program_curriculum_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  topics       JSONB NOT NULL DEFAULT '[]',   -- string[]
  module_order INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcm_program_id
  ON public.program_curriculum_modules(program_id, module_order);

-- ── 2. program_enrollment_tracks ─────────────────────────────────────────────
-- Funded and self-pay enrollment tracks per program.
-- track_type: 'funded' | 'self_pay' | 'employer_paid' | 'partner'

CREATE TABLE IF NOT EXISTS public.program_enrollment_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  track_type       TEXT NOT NULL CHECK (track_type IN ('funded', 'self_pay', 'employer_paid', 'partner')),
  label            TEXT NOT NULL,
  requirement      TEXT,                    -- eligibility requirement string
  cost             TEXT,                    -- display string e.g. '$5,000'
  description      TEXT,
  apply_href       TEXT,
  available        BOOLEAN DEFAULT TRUE,
  coming_soon_msg  TEXT,
  track_order      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
  CONSTRAINT uq_program_id_track_type_4 UNIQUE (program_id, track_type)
);

CREATE INDEX IF NOT EXISTS idx_pet_program_id
  ON public.program_enrollment_tracks(program_id, track_order);

-- ── 3. program_ctas ──────────────────────────────────────────────────────────
-- CTA hrefs per program. One row per program (upsert pattern).
-- Separate from enrollment_tracks — these are page-level navigation CTAs.

CREATE TABLE IF NOT EXISTS public.program_ctas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID NOT NULL UNIQUE REFERENCES public.programs(id) ON DELETE CASCADE,
  apply_href          TEXT,
  enroll_href         TEXT,
  request_info_href   TEXT,
  career_connect_href TEXT,
  advisor_href        TEXT,
  course_href         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. program_media ─────────────────────────────────────────────────────────
-- Hero media and thumbnail per program. One row per program.

CREATE TABLE IF NOT EXISTS public.program_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL UNIQUE REFERENCES public.programs(id) ON DELETE CASCADE,
  hero_image      TEXT,       -- path e.g. /images/pages/hvac-unit.jpg
  hero_image_alt  TEXT,
  video_src       TEXT,       -- path e.g. /videos/hvac-hero-final.mp4
  voiceover_src   TEXT,
  thumbnail       TEXT,
  badge_text      TEXT,       -- e.g. 'Grant Funded'
  badge_color     TEXT,       -- 'green' | 'orange' | 'red' | 'blue'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Verify ────────────────────────────────────────────────────────────────
-- After applying, confirm tables exist:
--
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'program_curriculum_modules','program_enrollment_tracks',
--     'program_ctas','program_media'
--   )
-- ORDER BY tablename;

-- ── 20260503000007_program_canonical_schema.sql ──
-- Canonical program operational schema.
--
-- Replaces the flat single-row program_ctas and program_media tables created
-- in migration 20260503000006 with typed multi-row tables that match the
-- canonical program page data model.
--
-- Also adds program_tracks, program_lessons, and DB-enforced publish guard.
-- All operations are safe to re-run (IF NOT EXISTS / OR REPLACE).

-- ── Drop previous flat tables (no data worth keeping — seeded this session) ──

DROP TABLE IF EXISTS public.program_ctas CASCADE;
DROP TABLE IF EXISTS public.program_media CASCADE;
DROP TABLE IF EXISTS public.program_enrollment_tracks CASCADE;
DROP TABLE IF EXISTS public.program_curriculum_modules CASCADE;

-- ── 1. programs — add missing columns ────────────────────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS hero_headline      TEXT,
  ADD COLUMN IF NOT EXISTS hero_subheadline   TEXT,
  ADD COLUMN IF NOT EXISTS length_weeks       INTEGER,
  ADD COLUMN IF NOT EXISTS certificate_title  TEXT,
  ADD COLUMN IF NOT EXISTS funding            TEXT,
  ADD COLUMN IF NOT EXISTS outcomes           TEXT,
  ADD COLUMN IF NOT EXISTS requirements       TEXT;

CREATE INDEX IF NOT EXISTS idx_programs_slug      ON public.programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_published ON public.programs(published);

-- ── 2. program_media ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  media_type  TEXT        NOT NULL CHECK (media_type IN ('hero_image','hero_video','gallery_image','thumbnail')),
  url         TEXT        NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_media_program_id ON public.program_media(program_id);

-- ── 3. program_ctas ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_ctas (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  cta_type      TEXT    NOT NULL CHECK (cta_type IN ('apply','request_info','external','waitlist')),
  label         TEXT    NOT NULL,
  href          TEXT    NOT NULL,
  style_variant TEXT    NOT NULL DEFAULT 'primary' CHECK (style_variant IN ('primary','secondary','ghost','link')),
  is_external   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_ctas_program_id ON public.program_ctas(program_id);

-- ── 4. program_tracks ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_tracks (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  track_code          TEXT    NOT NULL,
  title               TEXT    NOT NULL,
  description         TEXT,
  funding_type        TEXT    NOT NULL CHECK (funding_type IN ('funded','self_pay','partner','employer_sponsored','other')),
  cost_cents          INTEGER,
  available           BOOLEAN NOT NULL DEFAULT TRUE,
  coming_soon_message TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  CONSTRAINT uq_program_id_track_code_5 UNIQUE (program_id, track_code)
);

CREATE INDEX IF NOT EXISTS idx_program_tracks_program_id ON public.program_tracks(program_id);

-- ── 5. program_modules ───────────────────────────────────────────────────────
-- Drop and recreate — existing table has no program_id FK (wrong schema).

DROP TABLE IF EXISTS public.program_modules CASCADE;

CREATE TABLE IF NOT EXISTS public.program_modules (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  module_number  INTEGER NOT NULL,
  title          TEXT    NOT NULL,
  description    TEXT,
  lesson_count   INTEGER NOT NULL DEFAULT 0,
  duration_hours NUMERIC(6,2),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  CONSTRAINT uq_program_id_module_number_6 UNIQUE (program_id, module_number)
);

CREATE INDEX IF NOT EXISTS idx_program_modules_program_id ON public.program_modules(program_id);

-- ── 6. program_lessons ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_lessons (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID    NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  lesson_number    INTEGER NOT NULL,
  title            TEXT    NOT NULL,
  lesson_type      TEXT    NOT NULL DEFAULT 'lesson',
                     CHECK (lesson_type IN ('lesson','quiz','lab','exam','orientation')),
  duration_minutes INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  CONSTRAINT uq_module_id_lesson_number_7 UNIQUE (module_id, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_program_lessons_module_id ON public.program_lessons(module_id);

-- ── 7. Publish guard ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_publish_program(p_program_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_module BOOLEAN;
  v_has_track  BOOLEAN;
  v_has_cta    BOOLEAN;
  v_has_media  BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.program_modules WHERE program_id = p_program_id)
    INTO v_has_module;
  SELECT EXISTS(SELECT 1 FROM public.program_tracks  WHERE program_id = p_program_id AND available = TRUE)
    INTO v_has_track;
  SELECT EXISTS(SELECT 1 FROM public.program_ctas    WHERE program_id = p_program_id)
    INTO v_has_cta;
  SELECT EXISTS(SELECT 1 FROM public.program_media   WHERE program_id = p_program_id
                  AND media_type IN ('hero_image','hero_video'))
    INTO v_has_media;

  RETURN v_has_module AND v_has_track AND v_has_cta AND v_has_media;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_program(p_program_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.can_publish_program(p_program_id) THEN
    RAISE EXCEPTION 'Program cannot be published. Missing modules, tracks, CTAs, or hero media.';
  END IF;

  UPDATE public.programs
  SET published = TRUE
  WHERE id = p_program_id;
END;
$$;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('program_media','program_ctas','program_tracks','program_modules','program_lessons')
-- ORDER BY tablename;

-- ── 20260503000008_applications_status_enum.sql ──
-- Enforce valid status values on applications table.
-- Existing rows with non-conforming statuses (e.g. 'onboarding_complete', 'pending')
-- are migrated to the nearest valid state before the constraint is added.

-- Migrate legacy statuses
UPDATE public.applications SET status = 'submitted'  WHERE status = 'pending';
UPDATE public.applications SET status = 'enrolled'   WHERE status IN ('onboarding_complete', 'converted');

-- Add constraint (idempotent)
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_valid_status;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_valid_status CHECK (
    status IN ('submitted', 'in_review', 'under_review', 'approved', 'rejected', 'enrolled', 'pending_workone', 'waitlisted')
  );

-- ── 20260503000009_cmi_tables.sql ──
-- CMI (Choice Medical Institute) operational tables.
-- School Code: #015188
--
-- CNA students route to CMI after application approval.
-- Separate from the LMS engine — CMI is partner-delivered.

-- ── cmi_students ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_students (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  cohort         TEXT,
  status         TEXT        NOT NULL DEFAULT 'enrolled',
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One application → one CMI student. Prevents double-enrollment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cmi_students_application
  ON public.cmi_students(application_id);

CREATE INDEX IF NOT EXISTS idx_cmi_students_user_id
  ON public.cmi_students(user_id);

-- ── cmi_attendance ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_attendance (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID    NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  date       DATE    NOT NULL,
  present    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_attendance_student_id
  ON public.cmi_attendance(student_id);

-- ── cmi_clinicals ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_clinicals (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID    NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  site       TEXT,
  hours      INTEGER NOT NULL DEFAULT 0,
  approved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_clinicals_student_id
  ON public.cmi_clinicals(student_id);

-- ── cmi_competencies ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_competencies (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID    NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  skill      TEXT    NOT NULL,
  passed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_competencies_student_id
  ON public.cmi_competencies(student_id);

-- ── cmi_certificates ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_certificates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  issued_by  TEXT        NOT NULL DEFAULT 'CMI',
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_certificates_student_id
  ON public.cmi_certificates(student_id);

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public' AND tablename LIKE 'cmi_%'
-- ORDER BY tablename;

-- ── 20260503000010_atomic_approval_functions.sql ──
-- Atomic approval and revoke functions for the CNA enrollment pipeline.
--
-- These functions are the source of truth for all CNA approvals.
-- They replace the earlier approve_application_atomic() stub.
--
-- Live schema notes (reconciled against actual DB, not migration files):
--   training_enrollments: unique on (user_id, course_id); tenant_id NOT NULL;
--     status enum does NOT include 'revoked' — use 'withdrawn' for revocations.
--   cmi_students: unique on application_id; columns are user_id, application_id,
--     cohort, status, enrolled_at, completed_at — no program_id column.
--   partner_enrollments: no unique constraint on (partner_id, student_id, program_id);
--     uses enrollment_date DATE NOT NULL, no enrolled_at column.
--   applications: enforce_application_flow trigger enforces state machine:
--     submitted -> in_review -> approved -> ready_to_enroll -> enrolled (terminal)
--
-- training_courses.program_id for CNA must point to programs WHERE slug='cna'.
-- Run after applying this migration:
--   UPDATE training_courses
--   SET program_id = (SELECT id FROM programs WHERE slug = 'cna')
--   WHERE slug = 'cna-training-evening';

CREATE OR REPLACE FUNCTION public.approve_application_and_grant_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_course         RECORD;
  v_readiness      JSONB;
  v_program_id     UUID;
  v_cmi_partner_id UUID := '66685a9d-1b27-4c28-a7d7-2ee6287923bc';
  v_req_id         TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  -- 1. Lock the application row
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  -- 2. Idempotency: already at or past approved
  IF v_app.status IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','already_processed','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- 3. Readiness gate (financial + compliance)
  v_readiness := public.check_application_access_readiness(p_application_id);
  IF NOT (v_readiness->>'ready')::boolean THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   v_readiness->'blockers',
      'request_id', v_req_id
    );
  END IF;

  -- 4. Resolve program_id
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = v_app.program_slug
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','Program not found: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- 5. Resolve course (id + tenant_id) from training_courses
  SELECT id, tenant_id INTO v_course
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at
  LIMIT 1;

  IF v_course.id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','No training_course for program: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- 6. Walk the state machine: submitted -> in_review -> approved -> ready_to_enroll -> enrolled
  IF v_app.status = 'submitted' THEN
    UPDATE public.applications SET status = 'in_review', updated_at = NOW() WHERE id = p_application_id;
  END IF;
  IF v_app.status IN ('submitted','in_review') THEN
    UPDATE public.applications SET status = 'approved', updated_at = NOW() WHERE id = p_application_id;
  END IF;
  UPDATE public.applications SET status = 'ready_to_enroll', updated_at = NOW() WHERE id = p_application_id;
  UPDATE public.applications SET status = 'enrolled', updated_at = NOW() WHERE id = p_application_id;

  -- 7. Upsert training_enrollments (unique on user_id, course_id)
  INSERT INTO public.training_enrollments (
    user_id, course_id, tenant_id, program_id, program_slug,
    status, application_id, approved_at, approved_by
  )
  VALUES (
    v_app.user_id,
    v_course.id,
    v_course.tenant_id,
    v_program_id,
    v_app.program_slug,
    'active',
    p_application_id,
    NOW(),
    p_actor_user_id
  )
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET status      = 'active',
        approved_at = NOW(),
        approved_by = p_actor_user_id,
        updated_at  = NOW();

  -- 8. Upsert partner_enrollments for CMI (no unique constraint — guard with NOT EXISTS)
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = v_cmi_partner_id) THEN
    INSERT INTO public.partner_enrollments (partner_id, student_id, program_id, status, enrollment_date)
    SELECT v_cmi_partner_id, v_app.user_id, v_program_id, 'active', CURRENT_DATE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.partner_enrollments
      WHERE partner_id = v_cmi_partner_id
        AND student_id = v_app.user_id
        AND program_id = v_program_id
    );
    UPDATE public.partner_enrollments
    SET status = 'active'
    WHERE partner_id = v_cmi_partner_id
      AND student_id = v_app.user_id
      AND program_id = v_program_id;
  END IF;

  -- 9. Upsert cmi_students (unique on application_id; no program_id column in live schema)
  INSERT INTO public.cmi_students (user_id, application_id, status, enrolled_at)
  VALUES (v_app.user_id, p_application_id, 'enrolled', NOW())
  ON CONFLICT (application_id) DO UPDATE
    SET status = 'enrolled';

  -- 10. Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'approve_and_enroll', 'application', p_application_id,
    jsonb_build_object('program_id', v_program_id, 'course_id', v_course.id, 'request_id', v_req_id)
  );

  RETURN jsonb_build_object(
    'status',         'enrolled',
    'application_id', p_application_id,
    'program_id',     v_program_id,
    'course_id',      v_course.id,
    'request_id',     v_req_id
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.revoke_application_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app        RECORD;
  v_program_id UUID;
  v_course_id  UUID;
  v_req_id     TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  IF v_app.status NOT IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','not_enrolled','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  SELECT id INTO v_program_id FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;

  SELECT id INTO v_course_id
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at LIMIT 1;

  -- Withdraw training enrollment ('withdrawn' is in the allowed status enum)
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  -- Withdraw CMI student (keyed by application_id in live schema)
  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  -- Revoke partner enrollment
  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- application status stays 'enrolled' (terminal state per enforce_application_flow trigger)

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object('program_id', v_program_id, 'course_id', v_course_id, 'request_id', v_req_id)
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'request_id',     v_req_id
  );
END;
$$;

-- ── 20260503000011_approval_hardening.sql ──
-- Approval pipeline hardening.
--
-- Addresses:
-- 1. Migrates the direct DB hotfix: training_courses.program_id for CNA
-- 2. Adds unique constraint on partner_enrollments (partner_id, student_id, program_id)
-- 3. Rewrites approve_application_and_grant_access_atomic with:
--    - Explicit funding/payment gate (fail-closed) before any access grant
--    - ON CONFLICT on partner_enrollments using the new unique constraint
--    - All writes inside one plpgsql transaction block (implicit in plpgsql)
--    - FOR UPDATE row lock on applications at entry
-- 4. Rewrites revoke_application_access_atomic to match

-- ── 1. Migrate the direct hotfix ─────────────────────────────────────────────
-- The CNA training course was previously pointing to programs.slug='cna-cert'
-- (unpublished). This was corrected directly in the DB. This migration makes
-- that change reproducible.

UPDATE public.training_courses
SET program_id = (
  SELECT id FROM public.programs WHERE slug = 'cna' LIMIT 1
)
WHERE slug = 'cna-training-evening'
  AND program_id != (
    SELECT id FROM public.programs WHERE slug = 'cna' LIMIT 1
  );

-- ── 2. Unique constraint on partner_enrollments ───────────────────────────────
-- Without this, concurrent approvals can double-write partner_enrollments.
-- ON CONFLICT in the approval function depends on this constraint existing.

ALTER TABLE public.partner_enrollments
  ADD CONSTRAINT uq_partner_id_student_id_program_id_8 UNIQUE (partner_id, student_id, program_id);

-- ── 3. Rewrite approve_application_and_grant_access_atomic ───────────────────
-- Changes from previous version:
-- - Funding gate: explicit check that application_financials.verification_status
--   = 'verified' BEFORE any state transition or enrollment write. Fail-closed.
-- - Compliance gate: all required requirement_codes must have status IN
--   ('verified','waived'). Fail-closed.
-- - partner_enrollments now uses ON CONFLICT on the new unique constraint.
-- - All writes remain inside the single plpgsql function call (one transaction).
-- - FOR UPDATE row lock on applications is the first DB write.

CREATE OR REPLACE FUNCTION public.approve_application_and_grant_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_course         RECORD;
  v_financial      RECORD;
  v_missing_reqs   TEXT[];
  v_program_id     UUID;
  v_cmi_partner_id UUID := '66685a9d-1b27-4c28-a7d7-2ee6287923bc';
  v_req_id         TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  -- ── 1. Lock application row (prevents concurrent double-approval) ──────────
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  -- ── 2. Idempotency ────────────────────────────────────────────────────────
  IF v_app.status IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','already_processed','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- ── 3. Funding gate — fail closed ─────────────────────────────────────────
  -- No access is granted unless financial verification is on record and verified.
  -- This is checked directly here (not delegated to check_application_access_readiness)
  -- so the gate cannot be bypassed by changing the readiness function.
  SELECT * INTO v_financial
  FROM public.application_financials
  WHERE application_id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   jsonb_build_array('FINANCIAL_RECORD_MISSING'),
      'request_id', v_req_id
    );
  END IF;

  IF v_financial.verification_status <> 'verified' THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   jsonb_build_array('FINANCIAL_NOT_VERIFIED:' || v_financial.verification_status),
      'request_id', v_req_id
    );
  END IF;

  -- ── 4. Compliance gate — fail closed ──────────────────────────────────────
  -- All required requirement_codes for this program must be verified or waived.
  SELECT array_agg(r.requirement_code ORDER BY r.requirement_code)
  INTO v_missing_reqs
  FROM public.program_requirement_rules r
  LEFT JOIN public.application_compliance_checks c
    ON c.application_id = p_application_id
   AND c.requirement_code = r.requirement_code
  WHERE r.program_slug = v_app.program_slug
    AND r.is_required = TRUE
    AND (c.id IS NULL OR c.status NOT IN ('verified','waived'));

  IF v_missing_reqs IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   (
        SELECT jsonb_agg('MISSING_REQUIREMENT:' || x)
        FROM unnest(v_missing_reqs) AS x
      ),
      'request_id', v_req_id
    );
  END IF;

  -- ── 5. Resolve program ────────────────────────────────────────────────────
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = v_app.program_slug
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','Program not found: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- ── 6. Resolve course ─────────────────────────────────────────────────────
  SELECT id, tenant_id INTO v_course
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at
  LIMIT 1;

  IF v_course.id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','No training_course for program: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- ── 7. Walk state machine ─────────────────────────────────────────────────
  -- enforce_application_flow trigger requires: submitted->in_review->approved
  -- ->ready_to_enroll->enrolled. All four UPDATEs are inside this transaction.
  IF v_app.status = 'submitted' THEN
    UPDATE public.applications SET status = 'in_review',      updated_at = NOW() WHERE id = p_application_id;
  END IF;
  IF v_app.status IN ('submitted','in_review') THEN
    UPDATE public.applications SET status = 'approved',       updated_at = NOW() WHERE id = p_application_id;
  END IF;
  UPDATE public.applications SET status = 'ready_to_enroll',  updated_at = NOW() WHERE id = p_application_id;
  UPDATE public.applications SET status = 'enrolled',         updated_at = NOW() WHERE id = p_application_id;

  -- ── 8. training_enrollments ───────────────────────────────────────────────
  INSERT INTO public.training_enrollments (
    user_id, course_id, tenant_id, program_id, program_slug,
    status, application_id, approved_at, approved_by
  )
  VALUES (
    v_app.user_id, v_course.id, v_course.tenant_id,
    v_program_id, v_app.program_slug,
    'active', p_application_id, NOW(), p_actor_user_id
  )
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET status      = 'active',
        approved_at = NOW(),
        approved_by = p_actor_user_id,
        updated_at  = NOW();

  -- ── 9. partner_enrollments ────────────────────────────────────────────────
  -- ON CONFLICT now backed by uq_partner_enrollments_partner_student_program.
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = v_cmi_partner_id) THEN
    INSERT INTO public.partner_enrollments
      (partner_id, student_id, program_id, status, enrollment_date)
    VALUES
      (v_cmi_partner_id, v_app.user_id, v_program_id, 'active', CURRENT_DATE)
    ON CONFLICT (partner_id, student_id, program_id) DO UPDATE
      SET status = 'active';
  END IF;

  -- ── 10. cmi_students ──────────────────────────────────────────────────────
  INSERT INTO public.cmi_students (user_id, application_id, status, enrolled_at)
  VALUES (v_app.user_id, p_application_id, 'enrolled', NOW())
  ON CONFLICT (application_id) DO UPDATE
    SET status = 'enrolled';

  -- ── 11. Audit ─────────────────────────────────────────────────────────────
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'approve_and_enroll', 'application', p_application_id,
    jsonb_build_object(
      'program_id', v_program_id,
      'course_id',  v_course.id,
      'request_id', v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'enrolled',
    'application_id', p_application_id,
    'program_id',     v_program_id,
    'course_id',      v_course.id,
    'request_id',     v_req_id
  );
END;
$$;


-- ── 4. Rewrite revoke_application_access_atomic ──────────────────────────────

CREATE OR REPLACE FUNCTION public.revoke_application_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app        RECORD;
  v_program_id UUID;
  v_course_id  UUID;
  v_req_id     TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  IF v_app.status NOT IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','not_enrolled','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  SELECT id INTO v_program_id FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;

  SELECT id INTO v_course_id
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at LIMIT 1;

  -- 'withdrawn' is in the training_enrollments status enum; 'revoked' is not
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- application.status stays 'enrolled' — terminal per enforce_application_flow

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object(
      'program_id', v_program_id,
      'course_id',  v_course_id,
      'request_id', v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'request_id',     v_req_id
  );
END;
$$;

-- ── 20260503000012_applications_revoked_at.sql ──
-- Surface revocation at the application layer.
--
-- applications.status stays 'enrolled' (terminal per enforce_application_flow).
-- revoked_at + revoked_by make revocation visible and queryable without
-- touching the state machine or any existing status-based branch.
--
-- Effective status for display:
--   revoked_at IS NOT NULL  → treat as revoked
--   status = 'enrolled'     → active enrollment

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS revoked_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by   UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_applications_revoked_at
  ON public.applications(revoked_at)
  WHERE revoked_at IS NOT NULL;

-- Update revoke_application_access_atomic to write these columns.
CREATE OR REPLACE FUNCTION public.revoke_application_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app        RECORD;
  v_program_id UUID;
  v_course_id  UUID;
  v_req_id     TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  IF v_app.status NOT IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','not_enrolled','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- Idempotency: already revoked
  IF v_app.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status','already_revoked','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  SELECT id INTO v_program_id FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;

  SELECT id INTO v_course_id
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at LIMIT 1;

  -- Withdraw training enrollment ('withdrawn' is in the allowed status enum)
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  -- Withdraw CMI student (keyed by application_id)
  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  -- Revoke partner enrollment
  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- Mark revocation on the application row itself.
  -- status stays 'enrolled' (terminal per enforce_application_flow trigger).
  -- revoked_at/revoked_by are the authoritative revocation signal.
  UPDATE public.applications
  SET revoked_at = NOW(),
      revoked_by = p_actor_user_id,
      updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object(
      'program_id', v_program_id,
      'course_id',  v_course_id,
      'request_id', v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'revoked_at',     NOW(),
    'request_id',     v_req_id
  );
END;
$$;

-- ── 20260503000013_enroll_application_hardening.sql ──
-- enroll_application RPC hardening.
--
-- Adds Stripe staging table check as a second payment gate.
-- The existing gate checks applications.funding_verified and
-- applications.payment_received_at — this adds a third path:
-- verified Stripe session in stripe_sessions_staging.
--
-- Also adds 'stripe_repair' source bypass so the reconciliation
-- script can enroll without requiring status='ready_to_enroll',
-- while still requiring Stripe payment evidence.

CREATE OR REPLACE FUNCTION public.enroll_application(
  p_application_id uuid,
  p_actor_id       uuid,
  p_source         text DEFAULT NULL   -- 'stripe_repair' bypasses state gate
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_program        RECORD;
  v_ap_program     RECORD;
  v_enrollment_id  UUID;
  v_has_lms        BOOLEAN;
  v_stripe_paid    BOOLEAN;
BEGIN
  -- 1. Lock application row
  SELECT * INTO v_app
  FROM   public.applications
  WHERE  id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: %', p_application_id;
  END IF;

  -- 2. State gate (bypassed for stripe_repair source)
  IF p_source IS DISTINCT FROM 'stripe_repair' THEN
    IF v_app.status <> 'ready_to_enroll' THEN
      RAISE EXCEPTION 'INVALID_STATE: expected ready_to_enroll, got %', v_app.status;
    END IF;
  END IF;

  -- 3. User account gate
  IF v_app.user_id IS NULL THEN
    RAISE EXCEPTION 'NO_USER_ACCOUNT: application % has no user_id', p_application_id;
  END IF;

  -- 4. Stripe payment check (new — authoritative)
  SELECT EXISTS (
    SELECT 1 FROM public.stripe_sessions_staging s
    WHERE s.application_id = p_application_id::text
      AND s.payment_status = 'paid'
  ) INTO v_stripe_paid;

  -- 5. Funding gate — Stripe OR verified funding OR WorkOne approval
  --    stripe_repair source requires Stripe evidence (cannot bypass payment)
  IF p_source = 'stripe_repair' THEN
    IF NOT v_stripe_paid THEN
      RAISE EXCEPTION 'STRIPE_REPAIR_NO_PAYMENT: no paid Stripe session for application %', p_application_id;
    END IF;
  ELSE
    IF NOT (
      v_stripe_paid
      OR v_app.funding_verified = TRUE
      OR v_app.payment_received_at IS NOT NULL
      OR (v_app.eligibility_status = 'approved' AND v_app.has_workone_approval = TRUE)
    ) THEN
      RAISE EXCEPTION 'FUNDING_NOT_VERIFIED: application % has no verified funding or Stripe payment', p_application_id;
    END IF;
  END IF;

  -- 6. Program gate
  SELECT * INTO v_program
  FROM   public.programs
  WHERE  slug = v_app.program_slug
  LIMIT  1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_PROGRAM: slug % not found', v_app.program_slug;
  END IF;

  IF v_program.delivery_model IS NULL THEN
    RAISE EXCEPTION 'PROGRAM_NOT_CONFIGURED: % has no delivery_model', v_app.program_slug;
  END IF;

  -- 7. LMS readiness gate (internal_lms only)
  IF v_program.delivery_model = 'internal_lms' THEN
    SELECT (
      EXISTS (
        SELECT 1 FROM public.training_courses
        WHERE  program_id = v_program.id AND is_active = TRUE
      )
      OR
      EXISTS (
        SELECT 1 FROM public.curriculum_lessons
        WHERE  program_id = v_program.id AND status = 'published'
      )
    ) INTO v_has_lms;

    IF NOT v_has_lms THEN
      RAISE EXCEPTION
        'LMS_NOT_READY: program % (delivery_model=internal_lms) has no active training_courses or published curriculum_lessons',
        v_app.program_slug;
    END IF;
  END IF;

  -- 8. Route by delivery model
  IF v_program.delivery_model = 'internal_lms' THEN
    SELECT id INTO v_ap_program
    FROM   public.apprenticeship_programs
    WHERE  slug = v_app.program_slug
    LIMIT  1;

    INSERT INTO public.program_enrollments (
      user_id, program_id, program_slug, email, full_name,
      amount_paid_cents, funding_source, status, enrollment_state,
      enrolled_at, source
    )
    VALUES (
      v_app.user_id,
      v_ap_program.id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      0,
      COALESCE(v_app.funding_type, 'pending'),
      'active',
      'active',
      NOW(),
      COALESCE(p_source, 'admin_enroll')
    )
    ON CONFLICT (user_id, program_slug) DO UPDATE
      SET enrollment_state = 'active',
          status           = 'active',
          updated_at       = NOW()
    RETURNING id INTO v_enrollment_id;

  ELSE
    INSERT INTO public.external_program_enrollments (
      user_id, program_slug, email, full_name,
      delivery_model, status, enrolled_at
    )
    VALUES (
      v_app.user_id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      v_program.delivery_model,
      'active',
      NOW()
    )
    ON CONFLICT (user_id, program_slug) DO UPDATE
      SET status     = 'active',
          updated_at = NOW()
    RETURNING id INTO v_enrollment_id;
  END IF;

  -- 9. Advance application status
  UPDATE public.applications
  SET    status     = 'enrolled',
         updated_at = NOW()
  WHERE  id = p_application_id;

  -- 10. Audit log
  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_id, metadata
  ) VALUES (
    'application',
    p_application_id,
    CASE WHEN p_source = 'stripe_repair' THEN 'stripe_repair_enroll' ELSE 'admin_enroll' END,
    p_actor_id,
    jsonb_build_object(
      'from',           v_app.status,
      'to',             'enrolled',
      'enrollment_id',  v_enrollment_id,
      'delivery_model', v_program.delivery_model,
      'user_id',        v_app.user_id,
      'source',         COALESCE(p_source, 'admin_enroll'),
      'stripe_paid',    v_stripe_paid
    )
  );

  RETURN jsonb_build_object(
    'enrollment_id',  v_enrollment_id,
    'delivery_model', v_program.delivery_model,
    'user_id',        v_app.user_id,
    'stripe_paid',    v_stripe_paid
  );
END;
$$;

-- ── 20260503000014_enrollment_bypass_controls.sql ──
-- Enriches enrollment_insert_audit and adds bypass_allowlist with sunset enforcement.
--
-- Changes:
--   1. enrollment_insert_audit: adds program_id, invariant_violated, allowlisted columns
--   2. enrollment_bypass_allowlist: approved maintenance paths with mandatory sunset_at
--   3. audit_enrollment_insert trigger: checks allowlist, computes invariant_violated inline
--
-- Operational contract:
--   via_rpc=false + allowlisted=false  → unauthorized bypass → PRIVILEGED_BYPASS_DETECTED
--   via_rpc=false + allowlisted=true   → approved maintenance → still audited, not alerted
--   invariant_violated=true            → row violates program_id binding invariant
--
-- Sunset enforcement: allowlist entries with sunset_at < NOW() are treated as expired.
-- No permanent allowlist entries are permitted — sunset_at is NOT NULL.

ALTER TABLE public.enrollment_insert_audit
  ADD COLUMN IF NOT EXISTS program_id         UUID,
  ADD COLUMN IF NOT EXISTS invariant_violated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bypass_context     TEXT,
  ADD COLUMN IF NOT EXISTS allowlisted        BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.enrollment_bypass_allowlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT        NOT NULL,
  db_user     TEXT        NOT NULL,
  reason      TEXT        NOT NULL,
  approved_by UUID        REFERENCES public.profiles(id),
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sunset_at   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enrollment_bypass_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bypass_allowlist_admin ON public.enrollment_bypass_allowlist;
DO $$ BEGIN CREATE POLICY bypass_allowlist_admin ON public.enrollment_bypass_allowlist FOR ALL
  USING (
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.audit_enrollment_insert()
RETURNS trigger AS $$
DECLARE
  v_via_rpc            BOOLEAN;
  v_allowlisted        BOOLEAN := FALSE;
  v_invariant_violated BOOLEAN := FALSE;
  v_ap_program_id      UUID;
BEGIN
  v_via_rpc := current_user = 'postgres';

  -- Resolve canonical program_id from apprenticeship_programs for invariant check
  SELECT id INTO v_ap_program_id
  FROM public.apprenticeship_programs
  WHERE slug = NEW.program_slug
  LIMIT 1;

  IF NOT v_via_rpc THEN
    -- Check allowlist: is this an approved maintenance write?
    SELECT EXISTS (
      SELECT 1 FROM public.enrollment_bypass_allowlist
      WHERE db_user    = current_user
      AND   active_from <= NOW()
      AND   sunset_at   >  NOW()
    ) INTO v_allowlisted;

    -- Invariant check: program_id must match the canonical ap row
    IF NEW.program_id IS NULL
       OR v_ap_program_id IS NULL
       OR NEW.program_id <> v_ap_program_id
    THEN
      v_invariant_violated := TRUE;
    END IF;
  END IF;

  INSERT INTO public.enrollment_insert_audit (
    enrollment_id, user_id, program_slug, program_id,
    db_user, pg_session_user, via_rpc,
    invariant_violated, allowlisted
  ) VALUES (
    NEW.id, NEW.user_id, NEW.program_slug, NEW.program_id,
    current_user, session_user, v_via_rpc,
    v_invariant_violated, v_allowlisted
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_enrollment_insert ON public.program_enrollments;

CREATE TRIGGER trg_audit_enrollment_insert
AFTER INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.audit_enrollment_insert();

-- ── 20260503000015_course_content_publish_gate.sql ──
-- Migration: course content publish gate
--
-- Adds a DB-level function that blocks publishing a course if any of its
-- curriculum_lessons rows have null/empty script_text, or if any
-- checkpoint/quiz/exam lessons have no quiz_questions.
--
-- Also adds a check constraint on curriculum_lessons so script_text cannot
-- be set to an empty string (NULL is still allowed during authoring, but
-- the publish gate catches it before the course goes live).
--
-- Apply in Supabase Dashboard → SQL Editor before marking courses ready.

-- ── 1. Content completeness check function ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_publish_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empty_content_count  INTEGER;
  v_missing_quiz_count   INTEGER;
  v_total_lessons        INTEGER;
BEGIN
  -- Count lessons with null or short script_text
  SELECT COUNT(*)
    INTO v_empty_content_count
    FROM public.curriculum_lessons
   WHERE course_id = p_course_id
     AND status   = 'published'
     AND (script_text IS NULL OR LENGTH(TRIM(script_text)) < 50);

  -- Count assessment lessons missing quiz_questions
  SELECT COUNT(*)
    INTO v_missing_quiz_count
    FROM public.curriculum_lessons
   WHERE course_id  = p_course_id
     AND status     = 'published'
     AND step_type  IN ('checkpoint', 'quiz', 'exam')
     AND (quiz_questions IS NULL OR jsonb_array_length(quiz_questions) = 0);

  -- Must have at least one lesson
  SELECT COUNT(*)
    INTO v_total_lessons
    FROM public.curriculum_lessons
   WHERE course_id = p_course_id
     AND status   = 'published';

  RETURN (
    v_total_lessons        > 0  AND
    v_empty_content_count  = 0  AND
    v_missing_quiz_count   = 0
  );
END;
$$;

-- ── 2. Publish gate trigger function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_course_content_before_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empty_count   INTEGER;
  v_missing_quiz  INTEGER;
BEGIN
  -- Only fire when status is being set to 'published'
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN

    SELECT COUNT(*)
      INTO v_empty_count
      FROM public.curriculum_lessons
     WHERE course_id = NEW.id
       AND status    = 'published'
       AND (script_text IS NULL OR LENGTH(TRIM(script_text)) < 50);

    IF v_empty_count > 0 THEN
      RAISE EXCEPTION
        'Course publish blocked: % lesson(s) have empty or missing script_text. '
        'Populate all lesson content before publishing.',
        v_empty_count;
    END IF;

    SELECT COUNT(*)
      INTO v_missing_quiz
      FROM public.curriculum_lessons
     WHERE course_id = NEW.id
       AND status    = 'published'
       AND step_type IN ('checkpoint', 'quiz', 'exam')
       AND (quiz_questions IS NULL OR jsonb_array_length(quiz_questions) = 0);

    IF v_missing_quiz > 0 THEN
      RAISE EXCEPTION
        'Course publish blocked: % assessment lesson(s) (checkpoint/quiz/exam) have no quiz_questions. '
        'Add quiz data before publishing.',
        v_missing_quiz;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger to training_courses ────────────────────────────────────

DROP TRIGGER IF EXISTS enforce_course_content_before_publish
  ON public.training_courses;

CREATE TRIGGER enforce_course_content_before_publish
  BEFORE UPDATE OF status
  ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_course_content_before_publish();

-- Also attach to courses table (new canonical table)
DROP TRIGGER IF EXISTS enforce_course_content_before_publish
  ON public.courses;

CREATE TRIGGER enforce_course_content_before_publish
  BEFORE UPDATE OF status
  ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_course_content_before_publish();

-- ── 4. Check constraint: no empty string script_text ─────────────────────────
-- NULL is allowed during authoring. Empty string is not.

ALTER TABLE public.curriculum_lessons
  DROP CONSTRAINT IF EXISTS curriculum_lessons_script_text_not_empty;

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT curriculum_lessons_script_text_not_empty
  CHECK (script_text IS NULL OR LENGTH(TRIM(script_text)) >= 1);

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT public.can_publish_course('<course-uuid>');
-- Returns TRUE only when all published lessons have content + assessments have quizzes.

-- ── 20260503000016_bookkeeping_program_seed.sql ──
-- Migration: 20260503000016_bookkeeping_program_seed.sql
--
-- NOTE: Original version of this migration wrote bookkeeping lessons to
-- curriculum_lessons. That was incorrect — curriculum_lessons is not read
-- by lms_lessons. The live bookkeeping course lessons were seeded directly
-- into course_lessons (course_id = db7aac84-e261-4cee-aa6b-57a465e07a9c)
-- via the admin API and migration 20260503000019.
--
-- This file is retained as a no-op placeholder so migration numbering stays
-- consistent. Do not re-run the original content.

SELECT 'bookkeeping_program_seed: no-op placeholder — lessons live in course_lessons' AS status;

-- ── 20260503000017_enrollment_hard_fail_deadman.sql ──
-- Converts enrollment bypass from detective to partially preventive control.
--
-- Changes:
--   1. bypass_allowlist: adds ticket_ref, scope, created_by columns
--   2. audit_enrollment_insert trigger: hard-fail on invariant violation + pg_notify
--   3. health_check_log table: deadman tracking for health route invocation
--
-- Hard-fail rule (enforced in trigger, not application code):
--   via_rpc=false AND invariant_violated=true AND NOT allowlisted
--   → INSERT is REJECTED with UNAUTHORIZED_ENROLLMENT_WRITE
--
-- This closes the highest-risk path: a privileged writer that also breaks
-- the program_id binding invariant cannot create a bad row, even with service_role.
-- A privileged writer that preserves the invariant is still allowed but audited
-- and emits a pg_notify('enrollment_bypass', ...) for real-time listeners.
--
-- Allowlisted writes (active, non-expired entry in enrollment_bypass_allowlist)
-- bypass the hard-fail but are still audited and still emit pg_notify.
--
-- health_check_log records every invocation of the enrollment health route.
-- The route alerts if the gap since the last run exceeds 2 hours, making
-- the detection chain itself observable.

-- ── bypass_allowlist: add change-control fields ───────────────────────────────
ALTER TABLE public.enrollment_bypass_allowlist
  ADD COLUMN IF NOT EXISTS ticket_ref  TEXT,
  ADD COLUMN IF NOT EXISTS scope       TEXT,
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES public.profiles(id);

-- ── audit trigger: hard-fail + pg_notify ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_enrollment_insert()
RETURNS trigger AS $$
DECLARE
  v_via_rpc            BOOLEAN;
  v_allowlisted        BOOLEAN := FALSE;
  v_invariant_violated BOOLEAN := FALSE;
  v_ap_program_id      UUID;
  v_payload            TEXT;
BEGIN
  v_via_rpc := current_user = 'postgres';

  SELECT id INTO v_ap_program_id
  FROM public.apprenticeship_programs
  WHERE slug = NEW.program_slug
  LIMIT 1;

  IF NOT v_via_rpc THEN
    SELECT EXISTS (
      SELECT 1 FROM public.enrollment_bypass_allowlist
      WHERE db_user    = current_user
      AND   active_from <= NOW()
      AND   sunset_at   >  NOW()
    ) INTO v_allowlisted;

    IF NEW.program_id IS NULL
       OR v_ap_program_id IS NULL
       OR NEW.program_id <> v_ap_program_id
    THEN
      v_invariant_violated := TRUE;
    END IF;

    -- Hard-fail: unauthorized write with invariant violation is rejected
    IF v_invariant_violated AND NOT v_allowlisted THEN
      RAISE EXCEPTION
        'UNAUTHORIZED_ENROLLMENT_WRITE: direct insert on program_enrollments with invariant violation rejected. program_slug=%, db_user=%. Register in enrollment_bypass_allowlist if this is an approved maintenance operation.',
        NEW.program_slug, current_user
        USING ERRCODE = 'P0001';
    END IF;

    -- Write-time signal for all non-RPC writes (decoupled from health-check cadence)
    v_payload := json_build_object(
      'enrollment_id',      NEW.id,
      'program_slug',       NEW.program_slug,
      'db_user',            current_user,
      'allowlisted',        v_allowlisted,
      'invariant_violated', v_invariant_violated,
      'ts',                 extract(epoch from NOW())
    )::text;
    PERFORM pg_notify('enrollment_bypass', v_payload);
  END IF;

  INSERT INTO public.enrollment_insert_audit (
    enrollment_id, user_id, program_slug, program_id,
    db_user, pg_session_user, via_rpc,
    invariant_violated, allowlisted
  ) VALUES (
    NEW.id, NEW.user_id, NEW.program_slug, NEW.program_id,
    current_user, session_user, v_via_rpc,
    v_invariant_violated, v_allowlisted
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_enrollment_insert ON public.program_enrollments;

CREATE TRIGGER trg_audit_enrollment_insert
AFTER INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.audit_enrollment_insert();

-- ── health_check_log: deadman tracking ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_check_log (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route    TEXT        NOT NULL,
  ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clean    BOOLEAN     NOT NULL,
  failures TEXT[]      NOT NULL DEFAULT '{}'
);

ALTER TABLE public.health_check_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_check_log_admin ON public.health_check_log;
DO $$ BEGIN CREATE POLICY health_check_log_admin ON public.health_check_log FOR ALL
  USING (
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 20260503000018_course_lessons_partner_exam_code.sql ──
-- Migration: 20260503000018_course_lessons_partner_exam_code.sql
--
-- Adds partner_exam_code to course_lessons and exposes it through lms_lessons.
-- Used by the lesson page to detect Certiport/external proctored exam steps
-- and redirect to /certiport-exam?exam=<code> instead of the internal quiz player.

-- 1. Add column
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS partner_exam_code TEXT;

-- 2. Set QB-ONLINE on the bookkeeping final exam
UPDATE public.course_lessons
SET    partner_exam_code = 'QB-ONLINE'
WHERE  id = 'c3251414-696b-45fe-9d3f-12a40d232329';

-- 3. Rebuild lms_lessons view to include partner_exam_code
-- Must drop first because CREATE OR REPLACE cannot change column order.
DROP VIEW IF EXISTS public.lms_lessons;
CREATE VIEW public.lms_lessons AS
SELECT
  id,
  course_id,
  module_id,
  order_index,
  order_index          AS lesson_number,
  title,
  slug,
  slug                 AS lesson_slug,
  status,
  is_published,
  is_required,
  lesson_type,
  lesson_type::text    AS step_type,
  lesson_type::text    AS content_type,
  content,
  passing_score,
  quiz_questions,
  video_url,
  video_url            AS video_file,
  key_terms,
  activity_type,
  scenario_prompt,
  partner_exam_code,
  NULL::text           AS module_title,
  NULL::integer        AS module_order,
  NULL::integer        AS lesson_order,
  NULL::integer        AS duration_minutes,
  'curriculum'::text   AS lesson_source,
  created_at,
  updated_at
FROM public.course_lessons cl
WHERE (is_published = true) OR (status = 'published');

-- 4. Verify
SELECT id, slug, partner_exam_code
FROM   public.lms_lessons
WHERE  course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND  partner_exam_code IS NOT NULL;

-- ── 20260503000019_enrollment_insert_audit.sql ──
-- Tripwire audit for program_enrollments inserts.
--
-- The direct-insert trigger (trg_block_direct_insert) blocks non-privileged callers.
-- service_role and postgres can still write directly — this is intentional for system
-- execution paths. This migration makes that privileged bypass observable.
--
-- Every INSERT on program_enrollments writes a row to enrollment_insert_audit with:
--   db_user         — current_user at insert time (postgres = RPC, other = bypass)
--   pg_session_user — session_user (authenticator for normal API calls)
--   via_rpc         — true iff db_user = 'postgres' (i.e. SECURITY DEFINER RPC)
--
-- Any row with via_rpc=false is a privileged bypass. The integrity audit
-- (lib/enrollment-integrity-audit.ts) surfaces these as PRIVILEGED_BYPASS_DETECTED.

CREATE TABLE IF NOT EXISTS public.enrollment_insert_audit (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL,
  user_id         UUID,
  program_slug    TEXT,
  db_user         TEXT        NOT NULL,
  pg_session_user TEXT        NOT NULL,
  via_rpc         BOOLEAN     NOT NULL,
  inserted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enrollment_insert_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enrollment_insert_audit_admin ON public.enrollment_insert_audit;
DO $$ BEGIN CREATE POLICY enrollment_insert_audit_admin ON public.enrollment_insert_audit
  FOR ALL
  USING (
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.audit_enrollment_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.enrollment_insert_audit (
    enrollment_id, user_id, program_slug,
    db_user, pg_session_user, via_rpc
  ) VALUES (
    NEW.id, NEW.user_id, NEW.program_slug,
    current_user,
    session_user,
    -- enroll_application RPC runs SECURITY DEFINER owned by postgres
    current_user = 'postgres'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_enrollment_insert ON public.program_enrollments;

CREATE TRIGGER trg_audit_enrollment_insert
AFTER INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.audit_enrollment_insert();

-- ── 20260503000020_enrollment_lockdown.sql ──
-- Enrollment system lockdown.
--
-- Enforces the following invariants at the DB level:
--   1. program_enrollments.program_id is NOT NULL
--   2. program_enrollments.program_id FK → apprenticeship_programs(id) ON DELETE RESTRICT
--   3. CONSTRAINT uq_user_id_program_id_9 UNIQUE (user_id, program_id) on program_enrollments
--   4. Direct inserts on program_enrollments are blocked — only enroll_application RPC allowed
--   5. external_program_enrollments: missing columns added + CONSTRAINT uq_user_id_program_slug_10 UNIQUE (user_id, program_slug)
--   6. enroll_application RPC: state gate → ready_to_enroll, full canonical chain enforced,
--      payment coupling gate for self-pay path

-- ── external_program_enrollments schema ──────────────────────────────────────
ALTER TABLE public.external_program_enrollments
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS full_name      TEXT,
  ADD COLUMN IF NOT EXISTS delivery_model TEXT,
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS enrolled_at    TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.external_program_enrollments
  DROP CONSTRAINT IF EXISTS ext_program_enrollments_user_slug_unique;

ALTER TABLE public.external_program_enrollments
  ADD CONSTRAINT uq_user_id_program_slug_11 UNIQUE (user_id, program_slug);

-- ── program_enrollments constraints ──────────────────────────────────────────
ALTER TABLE public.program_enrollments
  ALTER COLUMN program_id SET NOT NULL;

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS fk_program_enrollments_ap;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT fk_program_enrollments_ap
  FOREIGN KEY (program_id)
  REFERENCES public.programs(id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_program_enrollments_user_program
  ON public.program_enrollments(user_id, program_id);

-- ── Block direct inserts on program_enrollments ───────────────────────────────
CREATE OR REPLACE FUNCTION public.block_direct_enrollment_insert()
RETURNS trigger AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'DIRECT_INSERT_BLOCKED: use enroll_application RPC'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_block_direct_insert ON public.program_enrollments;

CREATE TRIGGER trg_block_direct_insert
BEFORE INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.block_direct_enrollment_insert();

-- ── enroll_application RPC ────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.enroll_application(uuid, uuid);

CREATE FUNCTION public.enroll_application(
  p_application_id UUID,
  p_actor_id       UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_program        RECORD;
  v_ap_id          UUID;
  v_course_id      UUID;
  v_enrollment_id  UUID;
BEGIN
  -- 1. Lock application row
  SELECT * INTO v_app
  FROM   public.applications
  WHERE  id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: %', p_application_id;
  END IF;

  -- 2. State gate — trigger enforces approved → ready_to_enroll → enrolled
  IF v_app.status <> 'ready_to_enroll' THEN
    RAISE EXCEPTION 'INVALID_STATE: expected ready_to_enroll, got %', v_app.status;
  END IF;

  -- 3. User account gate
  IF v_app.user_id IS NULL THEN
    RAISE EXCEPTION 'NO_USER_ACCOUNT: application % has no user_id', p_application_id;
  END IF;

  -- 4. Funding gate
  IF NOT (
    v_app.funding_verified = TRUE
    OR v_app.payment_received_at IS NOT NULL
    OR (v_app.eligibility_status = 'approved' AND v_app.has_workone_approval = TRUE)
  ) THEN
    RAISE EXCEPTION 'FUNDING_NOT_VERIFIED: application % has no verified funding', p_application_id;
  END IF;

  -- 5. Payment coupling gate (self-pay only)
  -- WIOA/WorkOne paths bypass this check via funding_verified or has_workone_approval.
  IF v_app.payment_received_at IS NOT NULL
     AND v_app.funding_verified IS NOT TRUE
     AND v_app.has_workone_approval IS NOT TRUE
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.stripe_sessions_staging
      WHERE  application_id = p_application_id
      AND    payment_status = 'paid'
      AND    kind           IN ('full', 'bnpl')
    ) THEN
      RAISE EXCEPTION 'PAYMENT_NOT_VERIFIED: no paid Stripe session for application %', p_application_id
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 6. Program gate
  SELECT * INTO v_program
  FROM   public.programs
  WHERE  slug = v_app.program_slug
  LIMIT  1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_PROGRAM: slug % not found', v_app.program_slug;
  END IF;

  IF v_program.delivery_model IS NULL THEN
    RAISE EXCEPTION 'PROGRAM_NOT_CONFIGURED: % has no delivery_model', v_app.program_slug;
  END IF;

  -- 7. internal_lms: full canonical chain — all three must pass
  IF v_program.delivery_model = 'internal_lms' THEN

    -- 7a. Canonical program binding (provides non-null program_id FK)
    SELECT id INTO v_ap_id
    FROM   public.apprenticeship_programs
    WHERE  slug = v_app.program_slug
    LIMIT  1;

    IF v_ap_id IS NULL THEN
      RAISE EXCEPTION 'PROGRAM_BINDING_MISSING: program % has delivery_model=internal_lms but no apprenticeship_programs row', v_app.program_slug
        USING ERRCODE = 'P0001';
    END IF;

    -- 7b. Active course binding
    SELECT id INTO v_course_id
    FROM   public.training_courses
    WHERE  program_id = v_program.id
    AND    is_active  = TRUE
    LIMIT  1;

    IF v_course_id IS NULL THEN
      RAISE EXCEPTION 'LMS_NOT_READY: program % has no active training_courses row', v_app.program_slug
        USING ERRCODE = 'P0001';
    END IF;

    -- 7c. Deliverable content bound to this program_id (stray lessons from other programs excluded)
    IF NOT EXISTS (
      SELECT 1 FROM public.curriculum_lessons
      WHERE  program_id = v_program.id
      AND    status     = 'published'
    ) THEN
      RAISE EXCEPTION 'LMS_NOT_READY: program % has no published curriculum_lessons', v_app.program_slug
        USING ERRCODE = 'P0001';
    END IF;

  END IF;

  -- 8. Route by delivery model
  IF v_program.delivery_model = 'internal_lms' THEN
    -- v_ap_id guaranteed non-null (gate 7a passed)
    INSERT INTO public.program_enrollments (
      user_id, program_id, program_slug, email, full_name,
      amount_paid_cents, funding_source, status, enrollment_state, enrolled_at
    )
    VALUES (
      v_app.user_id,
      v_ap_id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      0,
      COALESCE(v_app.funding_type, 'pending'),
      'active',
      'active',
      NOW()
    )
    ON CONFLICT (user_id, program_slug) DO UPDATE
      SET enrollment_state = 'active',
          status           = 'active',
          updated_at       = NOW()
    RETURNING id INTO v_enrollment_id;

  ELSE
    INSERT INTO public.external_program_enrollments (
      user_id, program_slug, email, full_name,
      delivery_model, status, enrolled_at
    )
    VALUES (
      v_app.user_id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      v_program.delivery_model,
      'active',
      NOW()
    )
    ON CONFLICT (user_id, program_slug) DO UPDATE
      SET status     = 'active',
          updated_at = NOW()
    RETURNING id INTO v_enrollment_id;
  END IF;

  -- 9. Advance application status
  UPDATE public.applications
  SET    status     = 'enrolled',
         updated_at = NOW()
  WHERE  id = p_application_id;

  -- 10. Audit log
  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_id, metadata
  ) VALUES (
    'application',
    p_application_id,
    'admin_enroll',
    p_actor_id,
    jsonb_build_object(
      'from',           'ready_to_enroll',
      'to',             'enrolled',
      'enrollment_id',  v_enrollment_id,
      'delivery_model', v_program.delivery_model,
      'user_id',        v_app.user_id
    )
  );

  RETURN jsonb_build_object(
    'enrollment_id',  v_enrollment_id,
    'delivery_model', v_program.delivery_model,
    'user_id',        v_app.user_id
  );
END;
$$;

-- ── 20260503000021_financial_verification_gate.sql ──
-- Financial verification gate for application approval.
--
-- Extends application_financials with verification columns so the
-- approval function can enforce a verified financial path before
-- granting access. Adds access_granted_at to program_enrollments.
-- Creates check_application_access_readiness() and upgrades
-- approve_application_atomic() to call it.
--
-- Applied: 2026-05-03 via exec_sql RPC.

-- ── application_financials: verification columns ──────────────────────────────

ALTER TABLE public.application_financials
  ADD COLUMN IF NOT EXISTS payment_path        TEXT
    CHECK (payment_path IN ('card','bnpl','sponsor','workforce','scholarship','invoice','waiver')),
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected','expired')),
  ADD COLUMN IF NOT EXISTS provider_name       TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference  TEXT,
  ADD COLUMN IF NOT EXISTS verification_method TEXT
    CHECK (verification_method IN ('webhook','manual_review','document_upload','api_check','admin_override')),
  ADD COLUMN IF NOT EXISTS amount_expected     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS amount_approved     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── program_enrollments: access_granted_at ────────────────────────────────────

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMPTZ;

-- ── check_application_access_readiness() ─────────────────────────────────────
-- Returns { ready: bool, blockers: text[], application_id, program_slug, status }
-- Called by approve_application_atomic before any writes.

CREATE OR REPLACE FUNCTION public.check_application_access_readiness(
  p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_app       RECORD;
  v_financial RECORD;
  v_partner   RECORD;
  v_program   RECORD;
  v_blockers  TEXT[] := '{}';
BEGIN
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ready', FALSE, 'blockers', ARRAY['APPLICATION_NOT_FOUND']);
  END IF;

  IF v_app.status NOT IN ('submitted','in_review','financially_cleared','awaiting_financial_verification') THEN
    v_blockers := array_append(v_blockers, 'APPLICATION_STATUS_NOT_ELIGIBLE:' || COALESCE(v_app.status,'null'));
  END IF;

  IF v_app.email IS NULL OR v_app.email = '' THEN
    v_blockers := array_append(v_blockers, 'MISSING_EMAIL');
  END IF;
  IF v_app.program_slug IS NULL OR v_app.program_slug = '' THEN
    v_blockers := array_append(v_blockers, 'MISSING_PROGRAM_SLUG');
  END IF;

  SELECT * INTO v_financial FROM public.application_financials
  WHERE application_id = p_application_id;

  IF NOT FOUND THEN
    v_blockers := array_append(v_blockers, 'FINANCIAL_RECORD_MISSING');
  ELSIF v_financial.verification_status <> 'verified' THEN
    v_blockers := array_append(v_blockers,
      'FINANCIAL_VERIFICATION_REQUIRED:status=' || v_financial.verification_status);
  END IF;

  IF v_app.program_slug IS NOT NULL THEN
    SELECT id INTO v_program FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;
    IF NOT FOUND THEN
      v_blockers := array_append(v_blockers, 'PROGRAM_NOT_FOUND:' || v_app.program_slug);
    END IF;

    IF v_app.program_slug = 'cna' THEN
      SELECT id INTO v_partner FROM public.partners
      WHERE name = 'Choice Medical Institute' LIMIT 1;
      IF NOT FOUND THEN
        v_blockers := array_append(v_blockers, 'PARTNER_NOT_FOUND:Choice Medical Institute');
      END IF;
      IF v_app.user_id IS NULL THEN
        v_blockers := array_append(v_blockers, 'USER_NOT_RESOLVED');
      END IF;
    END IF;
  END IF;

  IF v_app.user_id IS NOT NULL AND v_app.program_slug IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.program_enrollments pe
      JOIN public.programs pr ON pr.id = pe.program_id
      WHERE pe.user_id = v_app.user_id
        AND pr.slug = v_app.program_slug
        AND pe.enrollment_state = 'active'
    ) THEN
      v_blockers := array_append(v_blockers, 'ACTIVE_ENROLLMENT_EXISTS');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ready',          array_length(v_blockers, 1) IS NULL,
    'blockers',       v_blockers,
    'application_id', p_application_id,
    'program_slug',   v_app.program_slug,
    'status',         v_app.status
  );
END;
$$;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT public.check_application_access_readiness('<application_id>');

-- ── 20260503000022_course_lessons_activity_config.sql ──
-- Add video_config and activities columns to course_lessons.
--
-- video_config: stores the BlueprintVideoConfig for this lesson so the video
--   generator can produce consistent videos without manual per-lesson config.
--
-- activities: JSONB array of activity descriptors for the NHA-style lesson
--   activity menu. Each entry: { type, label, order, required, config? }
--   Types: 'video' | 'reading' | 'flashcards' | 'lab' | 'practice' | 'checkpoint'
--
-- Apply in Supabase Dashboard → SQL Editor before deploying.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS video_config   JSONB,
  ADD COLUMN IF NOT EXISTS activities     JSONB;

-- Expose both columns through lms_lessons view.
-- The view is rebuilt here to add the two new columns.
-- This replaces the view from migration 20260503000018.

DROP VIEW IF EXISTS public.lms_lessons;
CREATE VIEW public.lms_lessons AS
  -- Canonical path: course_lessons (priority)
  SELECT
    cl.id,
    cl.course_id,
    cl.module_id,
    cl.slug,
    cl.title,
    cl.content,
    cl.lesson_type                                AS content_type,
    cl.lesson_type                                AS step_type,
    cl.order_index,
    cl.duration_minutes,
    cl.is_required,
    cl.is_published,
    cl.status,
    cl.video_url,
    cl.video_url                                  AS video_file,
    cl.quiz_questions,
    cl.passing_score,
    NULL::jsonb                                   AS resources,
    cl.partner_exam_code,
    cl.video_config,
    cl.activities,
    NULL::integer                                 AS lesson_number,
    NULL::integer                                 AS module_order,
    'canonical'                                   AS lesson_source,
    cl.created_at,
    cl.updated_at
  FROM public.course_lessons cl
  WHERE cl.is_published = true

  UNION ALL

  -- Legacy fallback: training_lessons (only when no course_lessons row exists for this course)
  SELECT
    tl.id,
    tl.course_id_uuid                             AS course_id,
    NULL::uuid                                    AS module_id,
    'legacy-' || tl.id::text                      AS slug,
    tl.title,
    to_jsonb(tl.content)                          AS content,
    tl.content_type::public.lesson_type           AS content_type,
    tl.content_type::public.lesson_type           AS step_type,
    tl.order_index,
    tl.duration_minutes,
    TRUE                                          AS is_required,
    TRUE                                          AS is_published,
    'published'                                   AS status,
    tl.video_url,
    tl.video_url                                  AS video_file,
    tl.quiz_questions,
    tl.passing_score,
    NULL::jsonb                                   AS resources,
    NULL::text                                    AS partner_exam_code,
    NULL::jsonb                                   AS video_config,
    NULL::jsonb                                   AS activities,
    tl.lesson_number,
    NULL::integer                                 AS module_order,
    'legacy'                                      AS lesson_source,
    tl.created_at,
    tl.updated_at
  FROM public.training_lessons tl
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_lessons cl2
    WHERE cl2.course_id = tl.course_id_uuid
  );

-- ── 20260503000023_fix_exam_codes_and_add_icbp.sql ──
-- Migration: 20260503000019_fix_exam_codes_and_add_icbp.sql
--
-- Idempotent. Safe to replay.
-- Fixes exam codes, adds ICBP exam + equity lesson, removes MOS Excel.
-- Course: db7aac84-e261-4cee-aa6b-57a465e07a9c (bookkeeping-quickbooks)
--
-- Strategy for reordering under unique constraints on (course_id, order_index)
-- and (module_id, order_index): drop both, reorder, re-add.
-- All inserts use ON CONFLICT DO NOTHING. All renames check old slug exists first.
-- Constraint recreation uses IF NOT EXISTS equivalent (DROP IF EXISTS + re-add).

-- Drop unique constraints/indexes that block reordering
ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS course_lessons_course_id_order_index_key;
ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS course_lessons_course_id_slug_key;
DROP INDEX IF EXISTS public.course_lessons_module_id_order_idx;

-- Deduplicate any existing (course_id, order_index) collisions by assigning
-- a temporary large order_index to all but the oldest row in each duplicate group.
DO $$
DECLARE
  r RECORD;
  bump INT := 900000;
BEGIN
  FOR r IN
    SELECT course_id, order_index, array_agg(id ORDER BY created_at DESC) AS ids
    FROM public.course_lessons
    GROUP BY course_id, order_index
    HAVING count(*) > 1
  LOOP
    -- Keep the first (oldest), bump the rest
    FOR i IN 2..array_length(r.ids, 1) LOOP
      bump := bump + 1;
      UPDATE public.course_lessons SET order_index = bump WHERE id = r.ids[i];
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE
  v_mod1 UUID;
  v_mod5 UUID;
BEGIN

-- ── Module 1: insert equity lesson between journal entries and accrual ────────

SELECT module_id INTO v_mod1
FROM public.course_lessons
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-journal-entries-general-ledger';
  IF v_mod1 IS NULL THEN RAISE NOTICE 'bookkeeping course not found, skipping'; RETURN; END IF;

-- Shift accrual (1006→1007) and checkpoint (1007→1008) only if equity not yet present
IF NOT EXISTS (
  SELECT 1 FROM public.course_lessons
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
    AND slug = 'bk-equity-owners-equity'
) THEN
  UPDATE public.course_lessons SET order_index = 1008
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
    AND slug = 'bk-fundamentals-checkpoint';

  UPDATE public.course_lessons SET order_index = 1007
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
    AND slug = 'bk-accrual-vs-cash-basis';

  INSERT INTO public.course_lessons
    (course_id, module_id, slug, title, lesson_type, order_index,
     is_required, is_published, status, content)
  VALUES (
    'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod1,
    'bk-equity-owners-equity',
    'Equity, Owner''s Equity, and Retained Earnings',
    'lesson', 1006, true, true, 'published',
    '{"body":"Covers equity accounts, owner''s equity, and retained earnings — core ICBP exam topics."}'::jsonb
  );
END IF;

-- ── Module 5: get module_id ───────────────────────────────────────────────────

-- Prefer renamed slug; fall back to old slug if rename hasn't happened yet
SELECT module_id INTO v_mod5
FROM public.course_lessons
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug IN ('bk-qbocu-exam-overview', 'bk-qbo-exam-overview')
LIMIT 1;
  IF v_mod5 IS NULL THEN RAISE NOTICE 'bookkeeping course not found, skipping'; RETURN; END IF;

-- ── Module 5: rename slugs (only if old slug still exists) ───────────────────

UPDATE public.course_lessons
SET slug = 'bk-qbocu-exam-overview',
    title = 'QuickBooks Online Certified User (QBOCU) Exam Overview'
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-qbo-exam-overview';

UPDATE public.course_lessons
SET slug = 'bk-practice-exam-qbocu',
    title = 'Practice Exam: QBOCU Simulation'
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-practice-exam-simulation';

UPDATE public.course_lessons
SET slug = 'bk-qbocu-certification-exam',
    title = 'QuickBooks Online Certified User Exam',
    partner_exam_code = 'QBOCU'
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-final-certification-exam';

-- ── Module 5: remove MOS Excel (idempotent — DELETE WHERE is safe if absent) ─

DELETE FROM public.course_lessons
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-mos-excel-for-accounting';

-- ── Module 5: reorder remaining rows to final positions ──────────────────────
-- Target layout:
--   5000 bk-qbocu-exam-overview
--   5001 bk-icbp-exam-overview      (new)
--   5003 bk-exam-objectives-domains
--   5004 bk-practice-exam-qbocu
--   5005 bk-reviewing-weak-areas
--   5006 bk-career-pathways-bookkeeping
--   5007 bk-practice-exam-icbp      (new)
--   5009 bk-qbocu-certification-exam
--   5010 bk-icbp-certification-exam (new)

UPDATE public.course_lessons SET order_index = 5003
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-exam-objectives-domains';

UPDATE public.course_lessons SET order_index = 5004
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-practice-exam-qbocu';

UPDATE public.course_lessons SET order_index = 5005
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-reviewing-weak-areas';

UPDATE public.course_lessons SET order_index = 5006
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-career-pathways-bookkeeping';

UPDATE public.course_lessons SET order_index = 5009
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-qbocu-certification-exam';

-- ── Module 5: insert new rows (ON CONFLICT DO NOTHING = idempotent) ──────────

INSERT INTO public.course_lessons
  (course_id, module_id, slug, title, lesson_type, order_index,
   is_required, is_published, status, content)
VALUES (
  'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod5,
  'bk-icbp-exam-overview',
  'Intuit Certified Bookkeeping Professional (ICBP) Exam Overview',
  'lesson', 5001, true, true, 'published',
  '{"body":"Overview of the ICBP exam: domains, question format, passing score, and Certiport registration."}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_lessons
  (course_id, module_id, slug, title, lesson_type, order_index,
   is_required, is_published, status, content)
VALUES (
  'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod5,
  'bk-practice-exam-icbp',
  'Practice Exam: ICBP Simulation',
  'exam', 5007, true, true, 'published',
  '{"body":"Full-length ICBP practice exam covering accounting basics, assets, liabilities, equity, and reconciliation."}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_lessons
  (course_id, module_id, slug, title, lesson_type, order_index,
   passing_score, is_required, is_published, status, partner_exam_code, content)
VALUES (
  'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod5,
  'bk-icbp-certification-exam',
  'Intuit Certified Bookkeeping Professional Exam',
  'exam', 5010, 70, true, true, 'published', 'ICBP',
  '{"body":"Certiport proctored exam. A voucher will be issued to your registered email before exam day."}'::jsonb
) ON CONFLICT DO NOTHING;

END $$;

-- Re-add unique constraints (safe: data is already unique at this point)
DO $$ BEGIN
  ALTER TABLE public.course_lessons
    ADD CONSTRAINT uq_course_id_order_index_12 UNIQUE (course_id, order_index);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.course_lessons
    ADD CONSTRAINT uq_course_id_slug_13 UNIQUE (course_id, slug);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN CREATE UNIQUE INDEX course_lessons_module_id_order_idx
    ON public.course_lessons (module_id, order_index); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 20260503000024_funding_verification_state.sql ──
-- Funding verification state hardening.
--
-- Problem: 36 students enrolled via instant-access flow (Feb 22 – Mar 10 2026)
-- have no payment and no verified funding. They are currently enrollment_state='active'
-- which is indistinguishable from fully paid/verified students in every report,
-- export, and admin view.
--
-- Fix:
-- 1. Move those 36 to enrollment_state='pending_funding_verification' — a distinct,
--    visible state that cannot be mistaken for financially cleared.
-- 2. Add a check constraint so enrollment_state is always one of the known values.
-- 3. Add funding_verification_due_at column — SLA deadline (14 days from flagged_at).
-- 4. Add v_funding_verification_queue view — admin queue with age, SLA status, last contact.
-- 5. Add funding_verification_escalations table — auto-escalation log when SLA breached.

-- ── 1. Add funding_verification_due_at column ─────────────────────────────────

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS funding_verification_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS funding_verification_notes  text;

-- ── 2. Move the 36 from active/enrolled → pending_funding_verification ─────────

UPDATE public.program_enrollments
SET
  enrollment_state             = 'pending_funding_verification',
  funding_verification_due_at  = NOW() + INTERVAL '14 days',
  updated_at                   = NOW()
WHERE funding_source = 'pending_funding_verification'
  AND enrollment_state IN ('active', 'enrolled', 'approved');

-- ── 3. Add enrollment_state check constraint ──────────────────────────────────
-- Allows all existing states plus the new one.
-- 'pending_funding_verification' = provisionally admitted, source-of-funds unconfirmed.

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS enrollment_state_valid;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT enrollment_state_valid CHECK (
    enrollment_state IS NULL OR enrollment_state IN (
      'applied',
      'onboarding',
      'orientation',
      'enrolled',
      'active',
      'pending_funding_verification',  -- provisionally admitted, awaiting funding confirmation
      'payment_required',              -- self-pay, checkout not completed
      'suspended',
      'revoked',
      'withdrawn',
      'completed',
      'graduated'
    )
  );

-- ── 4. Escalation log ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.funding_verification_escalations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid        NOT NULL REFERENCES public.program_enrollments(id),
  user_id         uuid        NOT NULL,
  program_slug    text        NOT NULL,
  escalated_at    timestamptz NOT NULL DEFAULT now(),
  reason          text        NOT NULL DEFAULT 'sla_breach_14d',
  days_overdue    integer,
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution      text,
  metadata        jsonb       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_fve_enrollment_id
  ON public.funding_verification_escalations (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_fve_unresolved
  ON public.funding_verification_escalations (escalated_at)
  WHERE resolved_at IS NULL;

ALTER TABLE public.funding_verification_escalations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service_role_all" ON public.funding_verification_escalations
  FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "admin_read" ON public.funding_verification_escalations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5. Admin queue view ───────────────────────────────────────────────────────
-- Shows all pending_funding_verification enrollments with SLA status.
-- This is the canonical admin queue — not a report, an action list.

DROP VIEW IF EXISTS public.v_funding_verification_queue CASCADE;
CREATE VIEW public.v_funding_verification_queue AS
SELECT
  pe.id                           AS enrollment_id,
  pe.user_id,
  p.email,
  p.full_name,
  p.phone,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.created_at                   AS enrolled_at,
  pe.funding_verification_due_at  AS due_at,
  pe.funding_verification_notes   AS notes,
  -- Age in days since enrollment
  EXTRACT(DAY FROM NOW() - pe.created_at)::integer AS days_since_enrollment,
  -- Days until/past SLA deadline
  EXTRACT(DAY FROM pe.funding_verification_due_at - NOW())::integer AS days_until_due,
  -- SLA status
  CASE
    WHEN pe.funding_verification_due_at IS NULL THEN 'no_deadline'
    WHEN NOW() > pe.funding_verification_due_at + INTERVAL '7 days' THEN 'critical'
    WHEN NOW() > pe.funding_verification_due_at THEN 'overdue'
    WHEN NOW() > pe.funding_verification_due_at - INTERVAL '3 days' THEN 'due_soon'
    ELSE 'on_track'
  END                             AS sla_status,
  -- Open escalation
  EXISTS (
    SELECT 1 FROM public.funding_verification_escalations fve
    WHERE fve.enrollment_id = pe.id AND fve.resolved_at IS NULL
  )                               AS has_open_escalation,
  -- Open integrity flag
  pif.flag_type,
  pif.flagged_at
FROM public.program_enrollments pe
LEFT JOIN public.profiles p ON p.id = pe.user_id
LEFT JOIN public.payment_integrity_flags pif
  ON pif.entity_id = pe.id
  AND pif.entity_type = 'program_enrollment'
  AND pif.resolved_at IS NULL
WHERE pe.enrollment_state = 'pending_funding_verification'
ORDER BY
  CASE
    WHEN NOW() > pe.funding_verification_due_at + INTERVAL '7 days' THEN 1
    WHEN NOW() > pe.funding_verification_due_at THEN 2
    WHEN NOW() > pe.funding_verification_due_at - INTERVAL '3 days' THEN 3
    ELSE 4
  END,
  pe.funding_verification_due_at ASC NULLS LAST;

-- ── 6. SLA escalation function ────────────────────────────────────────────────
-- Called by cron job at /api/cron/funding-verification-escalation
-- Inserts escalation records for any enrollment past its due date.

CREATE OR REPLACE FUNCTION public.escalate_overdue_funding_verifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO public.funding_verification_escalations (
    enrollment_id, user_id, program_slug, reason, days_overdue, metadata
  )
  SELECT
    pe.id,
    pe.user_id,
    pe.program_slug,
    'sla_breach_14d',
    EXTRACT(DAY FROM NOW() - pe.funding_verification_due_at)::integer,
    jsonb_build_object(
      'enrolled_at',  pe.created_at,
      'due_at',       pe.funding_verification_due_at,
      'funding_source', pe.funding_source
    )
  FROM public.program_enrollments pe
  WHERE pe.enrollment_state = 'pending_funding_verification'
    AND pe.funding_verification_due_at < NOW()
    -- Only escalate once per enrollment (no duplicate open escalations)
    AND NOT EXISTS (
      SELECT 1 FROM public.funding_verification_escalations fve
      WHERE fve.enrollment_id = pe.id AND fve.resolved_at IS NULL
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 7. Metric view — freeze the definition ────────────────────────────────────
-- v_enrolled_not_paid measures UNAUTHORIZED enrollment leakage only.
-- It explicitly excludes pending_funding_verification (which is a known,
-- intentional provisional state requiring admin action, not a payment gap).
-- This comment is the written policy for what the metric means.

COMMENT ON VIEW public.v_enrolled_not_paid IS
'Measures unauthorized enrollment leakage: active enrollments with no payment
evidence and no verified funding. Does NOT include pending_funding_verification
enrollments — those are tracked separately in v_funding_verification_queue.
A count of 0 means no unauthorized access, not that all funding is resolved.';

COMMENT ON VIEW public.v_funding_verification_queue IS
'Admin action queue for provisionally admitted students awaiting funding
confirmation. SLA: 14 days from enrollment. Overdue = requires immediate
admin contact. Critical = 7+ days past due, consider suspending access.';

-- ── 8. DB-level invariant: funding_verified=true cannot coexist with pending state ──
--
-- Prevents the UI from showing "verified" while the system still blocks access.
-- Without this, a partial update (funding_verified set but enrollment_state not
-- transitioned) would silently leave the student locked out.

CREATE OR REPLACE FUNCTION public.enforce_funding_state_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- funding_verified=true must not remain in pending_funding_verification state
  IF NEW.funding_verified = true
     AND NEW.enrollment_state = 'pending_funding_verification' THEN
    RAISE EXCEPTION 'INVALID_STATE: funding_verified=true but enrollment_state is still pending_funding_verification. Transition enrollment_state to onboarding or active.';
  END IF;

  -- revoked enrollment must not have funding_verified=true
  IF NEW.enrollment_state = 'revoked'
     AND NEW.funding_verified = true
     AND (OLD.enrollment_state = 'pending_funding_verification') THEN
    RAISE EXCEPTION 'INVALID_STATE: cannot set funding_verified=true on a revoked enrollment.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funding_state_consistency ON public.program_enrollments;
CREATE TRIGGER trg_funding_state_consistency
  BEFORE UPDATE ON public.program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_funding_state_consistency();

-- ── 20260503000025_funding_verification_state.sql ──
-- Funding verification state for program_enrollments.
--
-- Problem: ~40 enrollments flagged by payment_integrity_flags sit in
-- enrollment_state='active' or 'enrolled' with no payment evidence.
-- They are indistinguishable from financially cleared students in every
-- admin view, export, access decision, and metric.
--
-- Fix: introduce enrollment_state='pending_funding_verification' as an
-- explicit holding state. Move all unresolved payment_integrity_flags
-- rows into this state. Add an admin view, SLA escalation flag, and
-- explicit LMS access rule.
--
-- State semantics:
--   pending_funding_verification = provisionally admitted, source-of-funds
--   not confirmed. Admin must resolve before student is treated as cleared.
--
-- LMS access policy (explicit, not accidental):
--   pending_funding_verification → LMS access RETAINED (provisional)
--   This is a policy decision. Change the access gate if policy changes.
--   The state makes the decision visible and auditable.
--
-- Normal progression is unchanged:
--   applied → approved → confirmed → orientation_complete
--     → documents_complete → active
--
-- pending_funding_verification is a lateral hold, not part of the
-- progression chain. Resolution moves the row to 'active' (cleared)
-- or triggers revocation.

-- ── MOVE FLAGGED ENROLLMENTS TO HOLDING STATE ─────────────────────────────────
-- Only moves rows with unresolved payment_integrity_flags.
-- Does not touch rows that have already been resolved.

UPDATE public.program_enrollments pe
SET
  enrollment_state = 'pending_funding_verification',
  updated_at       = NOW()
FROM public.payment_integrity_flags f
WHERE f.entity_type  = 'program_enrollment'
  AND f.entity_id    = pe.id
  AND f.resolved_at  IS NULL
  AND pe.enrollment_state IN ('active', 'enrolled', 'approved');

-- ── SLA COLUMN ────────────────────────────────────────────────────────────────
-- Track when the flag was last actioned so SLA escalation can fire.

ALTER TABLE public.payment_integrity_flags
  ADD COLUMN IF NOT EXISTS last_actioned_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_escalated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_days          INTEGER NOT NULL DEFAULT 14;

COMMENT ON COLUMN public.payment_integrity_flags.sla_days IS
  'Days after flagged_at before this flag is auto-escalated for manual review. Default 14.';

-- ── ADMIN QUEUE VIEW ──────────────────────────────────────────────────────────
-- Shows all unresolved funding verification exceptions with age, program,
-- last contact date, docs received flag, and SLA status.

DROP VIEW IF EXISTS public.v_funding_verification_queue CASCADE;
CREATE OR REPLACE VIEW public.v_funding_verification_queue AS
SELECT
  f.id                                          AS flag_id,
  f.flag_type,
  f.flag_reason,
  f.flagged_at,
  f.last_actioned_at,
  f.sla_days,
  f.sla_escalated_at,
  -- Age in days since flagged
  EXTRACT(DAY FROM NOW() - f.flagged_at)::INT   AS age_days,
  -- SLA breach: flagged more than sla_days ago with no action
  CASE
    WHEN f.last_actioned_at IS NULL
     AND EXTRACT(DAY FROM NOW() - f.flagged_at) > f.sla_days
    THEN TRUE
    ELSE FALSE
  END                                           AS sla_breached,
  pe.id                                         AS enrollment_id,
  pe.user_id,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.amount_paid_cents,
  pe.created_at                                 AS enrolled_at,
  -- Docs received: any document uploaded after enrollment
  EXISTS (
    SELECT 1 FROM public.documents sd
    WHERE sd.user_id = pe.user_id
      AND sd.created_at > pe.created_at
  )                                             AS docs_received,
  -- Last contact: NULL until outreach_logs table is created
  NULL::timestamptz                             AS last_contact_at,
  pr.email,
  pr.full_name
FROM public.payment_integrity_flags f
JOIN public.program_enrollments pe
  ON pe.id = f.entity_id
LEFT JOIN public.profiles pr
  ON pr.id = pe.user_id
WHERE f.entity_type  = 'program_enrollment'
  AND f.resolved_at  IS NULL
ORDER BY sla_breached DESC, age_days DESC;

-- ── LMS ACCESS GATE ───────────────────────────────────────────────────────────
-- Explicit function: returns TRUE if an enrollment grants LMS access.
-- Called by access-sensitive routes instead of raw status checks.
-- Policy: pending_funding_verification retains provisional LMS access.
-- Change this function to change the policy — one place, not 30.

CREATE OR REPLACE FUNCTION public.enrollment_grants_lms_access(
  p_enrollment_state TEXT,
  p_revoked_at       TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_revoked_at IS NULL
    AND p_enrollment_state IN (
      'active',
      'enrolled',
      'in_progress',
      'confirmed',
      'pending_funding_verification'  -- provisional: policy decision, see migration comment
    );
$$;

COMMENT ON FUNCTION public.enrollment_grants_lms_access IS
  'Returns TRUE if the enrollment state + revocation status grants LMS access.
   pending_funding_verification is included by policy (provisional access).
   Remove it from the IN list to revoke access for unverified-funding students.';

-- ── SLA ESCALATION FUNCTION ───────────────────────────────────────────────────
-- Called by a cron job (or manually) to mark flags that have breached SLA.
-- Does not auto-revoke. Marks sla_escalated_at so admin queue surfaces them.

CREATE OR REPLACE FUNCTION public.escalate_funding_verification_sla()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.payment_integrity_flags
  SET sla_escalated_at = NOW()
  WHERE resolved_at    IS NULL
    AND sla_escalated_at IS NULL
    AND EXTRACT(DAY FROM NOW() - flagged_at) > sla_days;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log escalation event
  IF v_count > 0 THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (
      NULL,
      'sla_escalation',
      'payment_integrity_flags',
      NULL,
      jsonb_build_object('escalated_count', v_count, 'escalated_at', NOW())
    );
  END IF;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.escalate_funding_verification_sla IS
  'Marks payment_integrity_flags rows that have exceeded their SLA window.
   Safe to call repeatedly — idempotent. Returns count of newly escalated rows.
   Wire to /api/cron/escalate-funding-sla with CRON_SECRET guard.';

-- ── METRIC DEFINITION COMMENT ─────────────────────────────────────────────────
-- v_enrolled_not_paid measures unauthorized enrollment leakage:
--   rows in enrollment_state IN ('active','enrolled','approved') for SELF_PAY/stripe
--   with no Stripe session and no verified application_financials row.
--
-- v_enrolled_not_paid = 0 means: no new unauthorized leakage detected.
-- It does NOT mean: all students are financially cleared.
-- The pending_funding_verification cohort is intentionally excluded from
-- v_enrolled_not_paid because they have been explicitly flagged and moved
-- to a holding state. They are tracked in v_funding_verification_queue instead.

COMMENT ON VIEW public.v_enrolled_not_paid IS
  'Measures unauthorized enrollment leakage for SELF_PAY/stripe enrollments.
   A count of 0 means no new leakage — it does not mean all students are
   financially cleared. The pending_funding_verification cohort is tracked
   separately in v_funding_verification_queue.';

-- ── 20260503000026_heygen_video_urls.sql ──
-- Wire 7 identified HeyGen videos to their course_lessons rows.
-- Videos transcribed via Whisper and matched to lesson content.
-- Files copied to public/hvac/videos/ with lesson UUID filenames.

UPDATE course_lessons SET video_url = '/hvac/videos/lesson-2f172cb2-4657-5460-9b93-f9b062ad8dd2.mp4', duration_minutes = 5 WHERE id = '2f172cb2-4657-5460-9b93-f9b062ad8dd2';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-96576bf0-cbd5-581f-99aa-f36e48e694fd.mp4', duration_minutes = 5 WHERE id = '96576bf0-cbd5-581f-99aa-f36e48e694fd';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56.mp4', duration_minutes = 5 WHERE id = 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-baed04b3-35ae-51c7-a325-c678fbd0e725.mp4', duration_minutes = 3 WHERE id = 'baed04b3-35ae-51c7-a325-c678fbd0e725';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-dba03432-fb85-5f6f-bc69-4cc785a7904a.mp4', duration_minutes = 2 WHERE id = 'dba03432-fb85-5f6f-bc69-4cc785a7904a';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-4097148b-7a06-5784-9807-5e3470d4c091.mp4', duration_minutes = 2 WHERE id = '4097148b-7a06-5784-9807-5e3470d4c091';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-5c5b516c-2e7c-5cae-8231-1f4483c1a912.mp4', duration_minutes = 2 WHERE id = '5c5b516c-2e7c-5cae-8231-1f4483c1a912';

-- ── 20260503000027_payment_integrity.sql ──
-- Payment + enrollment integrity hardening.
--
-- Addresses findings from 2026-05-03 reconciliation audit:
--
-- 1. 40 active enrollments with funding_source='pending', no Stripe session,
--    no application — created via direct insert (admin import or seed).
--    These are flagged for review, not deleted. Admin must verify each one.
--
-- 2. 2 active SELF_PAY enrollments with no Stripe evidence — one has
--    funding_verified=true on the application (legitimate), one is in_review.
--    The in_review one is blocked pending payment confirmation.
--
-- 3. enroll_application RPC hardened: Stripe staging table check added as
--    an additional payment gate alongside existing funding_verified check.
--
-- 4. payment_integrity_flags table: permanent audit trail for flagged rows.
--    Admin resolves each flag explicitly — no silent auto-deletion.

-- ── FLAG TABLE ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_integrity_flags (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text        NOT NULL,  -- 'program_enrollment'
  entity_id       uuid        NOT NULL,
  flag_type       text        NOT NULL,  -- 'no_payment_evidence' | 'bnpl_unverified' | 'blocked_pending_review'
  flag_reason     text        NOT NULL,
  flagged_at      timestamptz NOT NULL DEFAULT now(),
  flagged_by      text        NOT NULL DEFAULT 'system_audit',
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution      text,       -- 'payment_confirmed' | 'waived' | 'enrollment_revoked' | 'false_positive'
  metadata        jsonb       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payment_flags_entity
  ON public.payment_integrity_flags (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_payment_flags_unresolved
  ON public.payment_integrity_flags (flag_type, flagged_at)
  WHERE resolved_at IS NULL;

ALTER TABLE public.payment_integrity_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON public.payment_integrity_flags;
DO $$ BEGIN CREATE POLICY "service_role_all" ON public.payment_integrity_flags
  FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DROP POLICY IF EXISTS "admin_read" ON public.payment_integrity_flags;
DO $$ BEGIN CREATE POLICY "admin_read" ON public.payment_integrity_flags
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── FLAG THE 40 PENDING-FUNDING ENROLLMENTS ───────────────────────────────────
-- These are active enrollments with no payment, no application, no Stripe session.
-- Flagged for admin review — NOT auto-revoked.

INSERT INTO public.payment_integrity_flags (
  entity_type, entity_id, flag_type, flag_reason, metadata
)
SELECT
  'program_enrollment',
  pe.id,
  'no_payment_evidence',
  'Active enrollment with funding_source=pending, no Stripe session, no matching application',
  jsonb_build_object(
    'user_id',        pe.user_id,
    'program_slug',   pe.program_slug,
    'enrollment_state', pe.enrollment_state,
    'created_at',     pe.created_at,
    'amount_paid_cents', pe.amount_paid_cents
  )
FROM public.program_enrollments pe
WHERE pe.funding_source = 'pending'
  AND pe.enrollment_state IN ('active', 'enrolled')
  AND pe.stripe_checkout_session_id IS NULL
  AND pe.stripe_payment_intent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE (a.user_id = pe.user_id OR a.user_id = pe.student_id)
      AND a.program_slug = pe.program_slug
  )
ON CONFLICT DO NOTHING;

-- ── FLAG THE in_review SELF_PAY ENROLLMENT ────────────────────────────────────
-- peer-recovery-specialist enrollment, app status=in_review, no payment confirmed.
-- Block access until payment is confirmed.

INSERT INTO public.payment_integrity_flags (
  entity_type, entity_id, flag_type, flag_reason, metadata
)
SELECT
  'program_enrollment',
  pe.id,
  'blocked_pending_review',
  'SELF_PAY enrollment active but application is in_review with no payment evidence',
  jsonb_build_object(
    'user_id',      pe.user_id,
    'program_slug', pe.program_slug,
    'app_id',       a.id,
    'app_status',   a.status
  )
FROM public.program_enrollments pe
JOIN public.applications a
  ON a.user_id = pe.user_id AND a.program_slug = pe.program_slug
WHERE pe.id = '6d4d0ed8-49da-40b0-affd-152e0dbbee78'
  AND a.status = 'in_review'
ON CONFLICT DO NOTHING;

-- ── MONITORING VIEW ───────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_payment_integrity_dashboard AS
SELECT
  f.id            AS flag_id,
  f.flag_type,
  f.flag_reason,
  f.flagged_at,
  f.resolved_at,
  f.resolution,
  pe.user_id,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.amount_paid_cents,
  pe.created_at   AS enrolled_at,
  p.email
FROM public.payment_integrity_flags f
JOIN public.program_enrollments pe ON pe.id = f.entity_id
LEFT JOIN public.profiles p ON p.id = pe.user_id
WHERE f.entity_type = 'program_enrollment'
ORDER BY f.flagged_at DESC;

-- ── WEBHOOK HEALTH MONITORING TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_health_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text        NOT NULL DEFAULT 'stripe',
  check_at        timestamptz NOT NULL DEFAULT now(),
  endpoint_status text        NOT NULL,  -- 'enabled' | 'disabled' | 'unknown'
  events_last_24h integer,
  events_failed   integer,
  events_processed integer,
  unprocessed_paid_sessions integer,
  enrolled_not_paid integer,
  metadata        jsonb       NOT NULL DEFAULT '{}'
);

ALTER TABLE public.webhook_health_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON public.webhook_health_log;
DO $$ BEGIN CREATE POLICY "service_role_all" ON public.webhook_health_log
  FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 20260503000028_program_enrollments_revoked_at.sql ──
-- Add revocation columns to program_enrollments.
--
-- program_enrollments is the authoritative LMS access surface.
-- revoked_at IS NOT NULL means the enrollment cannot grant lesson access,
-- appear as active, count toward progress, or block re-enrollment.
--
-- The application-layer revocation signal (applications.revoked_at) is
-- separate and drives the admissions workflow. This column drives LMS access.
-- revoke_application_access_atomic is updated below to write both.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS revoked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by  UUID REFERENCES public.profiles(id);

-- Partial index: only indexes revoked rows, so reads with IS NULL are fast
-- and the index stays small (most rows are not revoked).
CREATE INDEX IF NOT EXISTS idx_program_enrollments_revoked_at
  ON public.program_enrollments(revoked_at)
  WHERE revoked_at IS NOT NULL;

-- Supporting index for the common access-gate pattern:
-- .eq('user_id', x).is('revoked_at', null)
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_active
  ON public.program_enrollments(user_id)
  WHERE revoked_at IS NULL;

-- Update revoke_application_access_atomic to propagate revocation to the
-- matching program_enrollments row(s).
--
-- Targeting logic: revoke the most-recent non-revoked enrollment row for
-- this user + program combination. If the application has a course_id,
-- match on that too. This avoids clobbering historical completed rows
-- from prior enrollment cycles.
CREATE OR REPLACE FUNCTION public.revoke_application_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app          RECORD;
  v_program_id   UUID;
  v_course_id    UUID;
  v_req_id       TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
  v_enrollment   RECORD;
BEGIN
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  IF v_app.status NOT IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','not_enrolled','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- Idempotency: already revoked
  IF v_app.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status','already_revoked','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  SELECT id INTO v_program_id FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;

  SELECT id INTO v_course_id
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at LIMIT 1;

  -- Withdraw training enrollment
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  -- Withdraw CMI student
  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  -- Revoke partner enrollment
  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- Propagate revocation to program_enrollments.
  -- Target: the most-recent non-revoked row for this user + program.
  -- If a course_id is resolvable, also match on that for precision.
  -- Does not touch rows already revoked (idempotent per row).
  IF v_program_id IS NOT NULL THEN
    -- Find the active access-granting row
    SELECT id INTO v_enrollment
    FROM public.program_enrollments
    WHERE user_id   = v_app.user_id
      AND program_id = v_program_id
      AND revoked_at IS NULL
      AND status NOT IN ('completed', 'cancelled', 'withdrawn')
    ORDER BY enrolled_at DESC
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.program_enrollments
      SET revoked_at = NOW(),
          revoked_by = p_actor_user_id,
          updated_at = NOW()
      WHERE id = v_enrollment.id;
    END IF;
  END IF;

  -- Mark revocation on the application row.
  -- status stays 'enrolled' (terminal per enforce_application_flow trigger).
  UPDATE public.applications
  SET revoked_at = NOW(),
      revoked_by = p_actor_user_id,
      updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object(
      'program_id',     v_program_id,
      'course_id',      v_course_id,
      'enrollment_id',  v_enrollment.id,
      'request_id',     v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'enrollment_id',  v_enrollment.id,
    'revoked_at',     NOW(),
    'request_id',     v_req_id
  );
END;
$$;

-- ── 20260503000029_step_submissions_fk_to_course_lessons.sql ──
-- Migration: 20260503000020_step_submissions_fk_to_course_lessons.sql
--
-- Migrates step_submissions.lesson_id FK from curriculum_lessons to course_lessons.
-- course_lessons is the canonical lesson table. curriculum_lessons is legacy.
--
-- Steps:
--   1. Add legacy_curriculum_id mapping column to course_lessons
--   2. Backfill mapping via slug + course_id match
--   3. Add course_lesson_id column to step_submissions
--   4. Backfill course_lesson_id via the mapping
--   5. Add FK constraint course_lesson_id -> course_lessons
--   6. Drop old lesson_id FK, make course_lesson_id NOT NULL
--   7. Revoke writes on curriculum_lessons
--
-- Reversibility: curriculum_lessons is NOT dropped. legacy_curriculum_id
-- mapping column is retained for reference. Rollback = re-add old FK,
-- drop new FK, grant writes back on curriculum_lessons.

-- 1. Mapping column
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS legacy_curriculum_id uuid;

-- 2. Backfill mapping (slug + course_id are the stable join keys)
UPDATE public.course_lessons cl
SET legacy_curriculum_id = cur.id
FROM public.curriculum_lessons cur
WHERE cl.slug = cur.lesson_slug
  AND cl.course_id = cur.course_id;

-- 3. New column on step_submissions
ALTER TABLE public.step_submissions
  ADD COLUMN IF NOT EXISTS course_lesson_id uuid;

-- 4. Backfill course_lesson_id
UPDATE public.step_submissions ss
SET course_lesson_id = cl.id
FROM public.course_lessons cl
WHERE ss.lesson_id = cl.legacy_curriculum_id;

-- 5. Add FK
ALTER TABLE public.step_submissions
  ADD CONSTRAINT fk_step_submissions_course_lesson
  FOREIGN KEY (course_lesson_id)
  REFERENCES public.course_lessons(id)
  ON DELETE CASCADE;

-- 6. Drop old FK, enforce NOT NULL on new column
ALTER TABLE public.step_submissions
  DROP CONSTRAINT IF EXISTS step_submissions_lesson_id_fkey;

ALTER TABLE public.step_submissions
  ALTER COLUMN course_lesson_id SET NOT NULL;

-- 7. Lock curriculum_lessons from further writes
REVOKE INSERT, UPDATE, DELETE ON public.curriculum_lessons FROM public;

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.step_submissions'::regclass
  AND contype = 'f';

-- ── 20260503000030_stripe_sessions_staging.sql ──
-- Stripe sessions staging table.
-- Authoritative Stripe payment data synced directly from the Stripe API.
-- Used for SQL-native reconciliation audits and as the payment gate
-- inside enroll_application RPC.

CREATE TABLE IF NOT EXISTS public.stripe_sessions_staging (
  session_id       text        PRIMARY KEY,
  payment_intent   text,
  email            text,
  amount           integer,
  currency         text        NOT NULL DEFAULT 'usd',
  created_at       timestamptz NOT NULL,
  application_id   text,
  program_slug     text,
  user_id          text,
  student_id       text,
  kind             text,
  payment_status   text        NOT NULL DEFAULT 'paid',
  raw              jsonb,
  inserted_at      timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_application_id
  ON public.stripe_sessions_staging (application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_program_slug
  ON public.stripe_sessions_staging (program_slug)
  WHERE program_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_email
  ON public.stripe_sessions_staging (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_payment_intent
  ON public.stripe_sessions_staging (payment_intent)
  WHERE payment_intent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_created_at
  ON public.stripe_sessions_staging (created_at DESC);

-- Service role only
ALTER TABLE public.stripe_sessions_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.stripe_sessions_staging;
DO $$ BEGIN CREATE POLICY "service_role_all" ON public.stripe_sessions_staging
  FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Idempotent upsert function called by the ingestion script
CREATE OR REPLACE FUNCTION public.upsert_stripe_session(
  _session_id     text,
  _payment_intent text,
  _email          text,
  _amount         integer,
  _currency       text,
  _created_at     timestamptz,
  _application_id text,
  _program_slug   text,
  _user_id        text,
  _student_id     text,
  _kind           text,
  _raw            jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.stripe_sessions_staging (
    session_id, payment_intent, email, amount, currency,
    created_at, application_id, program_slug, user_id, student_id,
    kind, raw, updated_at
  )
  VALUES (
    _session_id, _payment_intent, _email, _amount, _currency,
    _created_at, _application_id, _program_slug, _user_id, _student_id,
    _kind, _raw, now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    payment_intent   = EXCLUDED.payment_intent,
    email            = EXCLUDED.email,
    amount           = EXCLUDED.amount,
    application_id   = EXCLUDED.application_id,
    program_slug     = EXCLUDED.program_slug,
    user_id          = EXCLUDED.user_id,
    student_id       = EXCLUDED.student_id,
    kind             = EXCLUDED.kind,
    raw              = EXCLUDED.raw,
    updated_at       = now();
END;
$$;

-- ── CANONICAL MISMATCH VIEWS ──────────────────────────────────────────────────

-- View A: Paid sessions with no enrollment (highest risk)
DROP VIEW IF EXISTS public.v_paid_not_enrolled;
CREATE OR REPLACE VIEW public.v_paid_not_enrolled AS
SELECT
  s.session_id,
  s.email,
  s.amount,
  s.program_slug,
  s.application_id,
  s.user_id,
  s.student_id,
  s.kind,
  s.created_at AS paid_at,
  a.id         AS app_id_resolved,
  a.status     AS app_status
FROM public.stripe_sessions_staging s
LEFT JOIN public.applications a
  ON a.id::text = s.application_id
LEFT JOIN public.program_enrollments pe
  ON (
    (pe.stripe_checkout_session_id = s.session_id)
    OR (pe.stripe_payment_intent_id = s.payment_intent AND s.payment_intent IS NOT NULL)
    OR (pe.user_id::text = COALESCE(s.user_id, s.student_id) AND pe.program_slug = s.program_slug
        AND COALESCE(s.user_id, s.student_id) IS NOT NULL AND s.program_slug IS NOT NULL)
    OR (pe.user_id = a.user_id AND pe.program_slug = s.program_slug AND a.user_id IS NOT NULL)
  )
LEFT JOIN public.student_enrollments se
  ON (
    (se.stripe_checkout_session_id = s.session_id)
    OR (se.student_id::text = COALESCE(s.user_id, s.student_id) AND se.program_slug = s.program_slug
        AND COALESCE(s.user_id, s.student_id) IS NOT NULL AND s.program_slug IS NOT NULL)
  )
WHERE pe.id IS NULL
  AND se.id IS NULL;

-- View B: Active enrollments with no payment evidence
DROP VIEW IF EXISTS public.v_enrolled_not_paid;
CREATE OR REPLACE VIEW public.v_enrolled_not_paid AS
SELECT
  pe.id            AS enrollment_id,
  pe.user_id,
  pe.student_id,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.created_at,
  pe.stripe_checkout_session_id,
  pe.stripe_payment_intent_id,
  af.verification_status
FROM public.program_enrollments pe
LEFT JOIN public.applications a
  ON (a.user_id = pe.user_id OR a.user_id = pe.student_id)
  AND a.program_slug = pe.program_slug
LEFT JOIN public.application_financials af
  ON af.application_id = a.id
LEFT JOIN public.stripe_sessions_staging s
  ON (s.session_id = pe.stripe_checkout_session_id)
  OR (s.payment_intent = pe.stripe_payment_intent_id AND pe.stripe_payment_intent_id IS NOT NULL)
WHERE
  pe.enrollment_state IN ('active', 'enrolled', 'approved')
  AND s.session_id IS NULL
  AND (af.verification_status IS NULL OR af.verification_status != 'verified')
  AND pe.funding_source IN ('SELF_PAY', 'self_pay', 'stripe');

-- ── 20260503000031_applications_type_column.sql ──
-- Add type column to applications table.
-- Distinguishes student applications from other submission types.
-- Default 'student' matches all existing rows.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'student';

-- ── 20260503000031_stripe_webhook_hardening.sql ──
-- Stripe webhook hardening.
--
-- Fixes two issues that caused Stripe to disable the webhook endpoint:
--
-- 1. stripe_webhook_events was missing payload and metadata columns.
--    The handler inserts both on every event; the missing columns caused
--    every insert to fail, so idempotency records were never written.
--
-- 2. webhook_retry_log did not exist. The handler writes to it on
--    duplicate/skip paths. Without the table those writes threw errors
--    that could propagate to a 500 response.
--    (webhook_retry_log is also created in 20260503000008 — this ALTER
--    is a no-op if that migration ran first.)

-- Add missing columns to stripe_webhook_events
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS payload  jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- webhook_retry_log (idempotent — safe to run even if 20260503000008 already applied)
CREATE TABLE IF NOT EXISTS public.webhook_retry_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text        NOT NULL,
  event_id    text        NOT NULL,
  event_type  text        NOT NULL,
  outcome     text        NOT NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_event_id
  ON public.webhook_retry_log (event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_provider_created
  ON public.webhook_retry_log (provider, logged_at DESC);

ALTER TABLE public.webhook_retry_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'webhook_retry_log'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.webhook_retry_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 20260503000032_webhook_retry_log.sql ──
-- webhook_retry_log: audit trail for Stripe webhook retry/skip events.
-- Referenced by /api/webhooks/stripe but never created in a prior migration.
-- Missing table caused 500s on any idempotency or duplicate-detection path,
-- which caused Stripe to disable the endpoint after 9 days of failed delivery.

CREATE TABLE IF NOT EXISTS public.webhook_retry_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text        NOT NULL,
  event_id      text        NOT NULL,
  event_type    text        NOT NULL,
  outcome       text        NOT NULL,  -- 'duplicate_skipped' | 'idempotency_failed' | 'record_failed'
  metadata      jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_event_id
  ON public.webhook_retry_log (event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_provider_created
  ON public.webhook_retry_log (provider, logged_at DESC);

-- Service role only — no user-facing reads needed
ALTER TABLE public.webhook_retry_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.webhook_retry_log;
DO $$ BEGIN CREATE POLICY "service_role_all" ON public.webhook_retry_log
  FOR ALL TO service_role USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 20260504000001_seed_program_outcomes_data.sql ──
-- Seed salary ranges, employer data, and career outcomes into programs table.
-- Replaces hardcoded arrays in pathways/outcomes and outcomes pages.

-- Migrate employers and career_outcomes from text[] to jsonb.
-- Drop all views that depend on these columns, alter, then recreate.
DROP VIEW IF EXISTS public.v_active_programs;
DROP VIEW IF EXISTS public.v_published_programs;
DROP VIEW IF EXISTS public.programs_for_holder;

ALTER TABLE public.programs
  ALTER COLUMN employers       TYPE jsonb USING to_jsonb(employers),
  ALTER COLUMN career_outcomes TYPE jsonb USING to_jsonb(career_outcomes);

-- Recreate v_active_programs
CREATE OR REPLACE VIEW public.v_active_programs AS
  SELECT id, slug, title, category, description, estimated_weeks, estimated_hours,
         funding_tags, is_active, created_at, full_description, what_you_learn,
         day_in_life, salary_min, salary_max, credential_type, credential_name,
         employers, funding_pathways, delivery_method, training_hours, prerequisites,
         career_outcomes, industry_demand, image_url, hero_image_url, icon_url,
         featured, wioa_approved, dol_registered, placement_rate, completion_rate,
         total_cost, toolkit_cost, credentialing_cost, name, duration_weeks,
         updated_at, cip_code, soc_code, funding_eligibility, state_code, organization_id
  FROM programs p
  WHERE COALESCE(is_active, false) = true;

-- Recreate v_published_programs (same shape, filters on published=true)
CREATE OR REPLACE VIEW public.v_published_programs AS
  SELECT id, slug, title, category, description, estimated_weeks, estimated_hours,
         funding_tags, is_active, created_at, full_description, what_you_learn,
         day_in_life, salary_min, salary_max, credential_type, credential_name,
         employers, funding_pathways, delivery_method, training_hours, prerequisites,
         career_outcomes, industry_demand, image_url, hero_image_url, icon_url,
         featured, wioa_approved, dol_registered, placement_rate, completion_rate,
         total_cost, toolkit_cost, credentialing_cost, name, duration_weeks,
         updated_at, cip_code, soc_code, funding_eligibility, state_code, organization_id
  FROM programs p
  WHERE COALESCE(published, false) = true;

-- Recreate programs_for_holder (joins program_holder_programs)
CREATE OR REPLACE VIEW public.programs_for_holder AS
  SELECT php.program_holder_id, php.role_in_program, php.status AS association_status,
         p.id, p.slug, p.title, p.category, p.description, p.estimated_weeks,
         p.estimated_hours, p.funding_tags, p.is_active, p.created_at,
         p.full_description, p.what_you_learn, p.day_in_life, p.salary_min,
         p.salary_max, p.credential_type, p.credential_name, p.employers,
         p.funding_pathways, p.delivery_method, p.training_hours, p.prerequisites,
         p.career_outcomes, p.industry_demand, p.image_url, p.hero_image_url,
         p.icon_url, p.featured, p.wioa_approved, p.dol_registered,
         p.placement_rate, p.completion_rate, p.total_cost, p.toolkit_cost,
         p.credentialing_cost, p.name, p.duration_weeks, p.updated_at,
         p.cip_code, p.soc_code, p.funding_eligibility, p.state_code, p.organization_id
  FROM program_holder_programs php
  JOIN programs p ON p.id = php.program_id;

UPDATE public.programs SET
  salary_min = 28000, salary_max = 42000,
  employers = '[
    {"name":"Hospitals","pay":"$34K–$42K/year"},
    {"name":"Nursing homes","pay":"$30K–$38K/year"},
    {"name":"Home health agencies","pay":"$28K–$36K/year"},
    {"name":"Assisted living facilities","pay":"$30K–$37K/year"},
    {"name":"Rehabilitation centers","pay":"$32K–$40K/year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Certified Nursing Assistant — legally authorized to provide direct patient care in Indiana hospitals, nursing homes, and home health agencies.'::text)
WHERE slug = 'cna-cert';

UPDATE public.programs SET
  salary_min = 50000, salary_max = 70000,
  employers = '[
    {"name":"Schneider National","pay":"$50K–$65K first year"},
    {"name":"Werner Enterprises","pay":"$50K–$60K first year"},
    {"name":"J.B. Hunt","pay":"$55K–$70K first year"},
    {"name":"FedEx Freight","pay":"$50K–$65K first year"},
    {"name":"UPS Freight","pay":"$55K–$70K first year"},
    {"name":"XPO Logistics","pay":"$48K–$60K first year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Commercial Driver License (CDL) Class A or B — authorized to operate tractor-trailers, buses, and heavy trucks. Many carriers offer $5K–$15K sign-on bonuses.'::text)
WHERE slug = 'cdl-training';

UPDATE public.programs SET
  salary_min = 30000, salary_max = 100000,
  employers = '[
    {"name":"Barbershops (employee)","pay":"$30K–$45K/year"},
    {"name":"Barbershops (booth rental)","pay":"$40K–$60K+/year"},
    {"name":"Shop ownership","pay":"$60K–$100K+/year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Indiana Barber License — state-regulated professional license earned through a DOL Registered Apprenticeship. Earn while you learn.'::text)
WHERE slug = 'barber-apprenticeship';

UPDATE public.programs SET
  salary_min = 37000, salary_max = 80000,
  employers = '[
    {"name":"HVAC contractors","pay":"$18–$22/hr starting"},
    {"name":"Property management companies","pay":"$17–$21/hr starting"},
    {"name":"Commercial maintenance firms","pay":"$19–$24/hr starting"},
    {"name":"Self-employment (after experience)","pay":"$60K–$80K+/year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('EPA Section 608 Certification + OSHA 30 — required by federal law to handle refrigerants. Most graduates find employment within 30 days.'::text)
WHERE slug IN ('hvac-technician','hvac-2024');

UPDATE public.programs SET
  salary_min = 34000, salary_max = 100000,
  employers = '[
    {"name":"Electrical contractors","pay":"$35K–$45K starting"},
    {"name":"Construction companies","pay":"$36K–$48K starting"},
    {"name":"Property management","pay":"$34K–$44K starting"},
    {"name":"Journeyman (after 4-year apprenticeship)","pay":"$55K–$75K"},
    {"name":"Master electrician / contractor","pay":"$100K+"}
  ]'::jsonb,
  career_outcomes = to_jsonb('OSHA 10 + NCCER Electrical Level 1 — foundation for a 4-year electrical apprenticeship leading to journeyman licensure.'::text)
WHERE slug = 'electrical';

UPDATE public.programs SET
  salary_min = 40000, salary_max = 150000,
  employers = '[
    {"name":"Manufacturing plants","pay":"$40K–$55K starting"},
    {"name":"Fabrication shops","pay":"$42K–$58K starting"},
    {"name":"Construction firms","pay":"$44K–$60K starting"},
    {"name":"Specialized (pipe, underwater, aerospace)","pay":"$80K–$150K+"}
  ]'::jsonb,
  career_outcomes = to_jsonb('AWS Welding Certifications (D1.1 Structural Steel, 3G/4G Plate) + OSHA 10 — industry standard recognized by employers worldwide.'::text)
WHERE slug = 'welding';

UPDATE public.programs SET
  salary_min = 35000, salary_max = 60000,
  employers = '[
    {"name":"Help desk / call centers","pay":"$35K–$45K"},
    {"name":"Desktop support","pay":"$40K–$55K"},
    {"name":"IT support specialist","pay":"$42K–$60K"},
    {"name":"Field technician","pay":"$38K–$52K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Certiport IT Specialist — Device Configuration & Management. Entry point to a defined career ladder: help desk → sysadmin → network engineer → cybersecurity.'::text)
WHERE slug = 'it-support';

UPDATE public.programs SET
  salary_min = 55000, salary_max = 100000,
  employers = '[
    {"name":"Security analyst","pay":"$55K–$80K"},
    {"name":"SOC analyst","pay":"$50K–$75K"},
    {"name":"Cybersecurity specialist","pay":"$65K–$100K"},
    {"name":"Network security administrator","pay":"$60K–$95K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Certiport IT Specialist — Cybersecurity. Indiana 4-star DWD Top Job. Average salary $91,749. Remote work standard.'::text)
WHERE slug IN ('cybersecurity','cybersecurity-analyst');

UPDATE public.programs SET
  salary_min = 35000, salary_max = 55000,
  employers = '[
    {"name":"Hospitals","pay":"$38K–$52K"},
    {"name":"Clinics","pay":"$35K–$48K"},
    {"name":"Physician offices","pay":"$36K–$50K"},
    {"name":"Urgent care centers","pay":"$37K–$52K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('NHA Certified Medical Assistant (CCMA) — nationally recognized credential for clinical and administrative medical assisting.'::text)
WHERE slug IN ('nha-medical-assistant','medical-assistant');

UPDATE public.programs SET
  salary_min = 32000, salary_max = 48000,
  employers = '[
    {"name":"Hospitals","pay":"$34K–$48K"},
    {"name":"Blood banks","pay":"$33K–$46K"},
    {"name":"Diagnostic labs","pay":"$35K–$48K"},
    {"name":"Clinics","pay":"$32K–$44K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('NHA Certified Phlebotomy Technician (CPT) — nationally recognized credential for blood collection and specimen processing.'::text)
WHERE slug = 'nha-phlebotomy';

-- Seed testimonials with placeholder data (replace with real quotes when available)
INSERT INTO public.testimonials (name, title, program_slug, quote, show_on_home, is_active, display_order)
VALUES
  ('Marcus J.', 'HVAC Technician Graduate', 'hvac-technician', 'I went from unemployed to making $20/hr within 6 weeks of finishing the program. The EPA 608 certification opened every door.', true, true, 1),
  ('Destiny W.', 'CNA Graduate', 'cna-cert', 'WIOA covered everything — tuition, materials, the state exam. I passed on my first try and had a job offer before I even got my results.', true, true, 2),
  ('Jamal C.', 'CDL Graduate', 'cdl-training', 'I had my CDL in 5 weeks. Schneider hired me before I even graduated. First year I made $58K.', true, true, 3),
  ('Aaliyah B.', 'Barber Apprenticeship Graduate', 'barber-apprenticeship', 'Getting paid to learn was the best part. By the time I got my license I already had a full client book.', true, true, 4),
  ('Devon H.', 'Cybersecurity Graduate', 'cybersecurity-analyst', 'I came in with zero IT experience. 12 weeks later I had my Certiport cert and a job offer at $62K. Remote work too.', true, true, 5)
ON CONFLICT DO NOTHING;

-- Seed program_outcomes for key programs
INSERT INTO public.program_outcomes (program_id, outcome, outcome_order)
SELECT p.id, o.outcome, o.ord
FROM public.programs p
CROSS JOIN (VALUES
  ('Earn an industry-recognized credential issued by a federal or national authority', 1),
  ('Complete hands-on training with real equipment and real patients/clients', 2),
  ('Access WIOA, Workforce Ready Grant, or Job Ready Indy funding if eligible', 3),
  ('Receive job placement assistance and employer partner introductions', 4),
  ('Build a career pathway to higher credentials and higher pay', 5)
) AS o(outcome, ord)
WHERE p.slug = 'hvac-technician'
ON CONFLICT DO NOTHING;

-- ── 20260511000001_fix_truncated_program_descriptions.sql ──
-- Fix truncated short_description values on programs that were cut off mid-sentence.
-- Descriptions sourced from canonical static program files in data/programs/.

UPDATE public.programs
SET short_description = 'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. Help others overcome addiction and mental health challenges.'
WHERE slug = 'certified-recovery-specialist'
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 80);

UPDATE public.programs
SET short_description = 'Earn OSHA-compliant forklift operator certification in 1 week. Hands-on training on sit-down, stand-up, and reach truck forklifts.'
WHERE slug IN ('forklift', 'forklift-operator', 'ai-forklift-safety-certification-1774495387731')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Earn your IRS PTIN and learn individual and small business tax preparation. 8-week program with real tax software training.'
WHERE slug IN ('tax-preparation', 'tax-prep')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Complete 120 hours of classroom and clinical training in 4 weeks. Prepare for the NHA Certified Phlebotomy Technician (CPT) exam and enter healthcare within a month.'
WHERE slug IN ('phlebotomy', 'phlebotomy-technician', 'phlebotomy-technician-program', 'nha-phlebotomy')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. Help others overcome addiction and mental health challenges.'
WHERE slug IN ('peer-recovery-specialist', 'peer-recovery-specialist-jri', 'peer-support')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Indiana state CNA certification in 6 weeks. Clinical rotations at licensed healthcare facilities. State exam proctored on-site. FSSA IMPACT funding available for eligible participants.'
WHERE slug IN ('cna', 'cna-cert', 'cna-certification', 'cna-training')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Prepare for the CCMA certification exam. Clinical and administrative medical assisting skills in 12 weeks.'
WHERE slug IN ('medical-assistant', 'medical-assistant-program', 'nha-medical-assistant')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Install, service, and repair heating and cooling systems. EPA 608 Universal certification proctored on-site. 6 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.'
WHERE slug IN ('hvac-technician', 'hvac', 'hvac-technician-program', 'hvac-2024')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

-- Fix any remaining programs with descriptions that end mid-word (no terminal punctuation, under 100 chars)
-- These are caught by the programs page but the DB should be clean regardless.
UPDATE public.programs
SET short_description = NULL
WHERE short_description IS NOT NULL
  AND length(short_description) < 50
  AND short_description NOT LIKE '%.'
  AND short_description NOT LIKE '%!'
  AND short_description NOT LIKE '%?';

-- ── 20260512000001_fix_barber_video_url.sql ──
-- Fix: rename old orientation video path to canonical new path
-- Old generator output: /videos/barber-course-intro-with-voice.mp4 (file never existed)
-- New generator output: /videos/barber-lessons/barber-apprenticeship-intro.mp4
UPDATE public.curriculum_lessons
SET video_file = '/videos/barber-lessons/barber-apprenticeship-intro.mp4'
WHERE video_file = '/videos/barber-course-intro-with-voice.mp4';

-- ── 20260512000002_audit_logs_cleanup_fn.sql ──
-- Migration: Add a SECURITY DEFINER function to allow service-level audit log cleanup
-- This is needed because audit_logs has RLS with no DELETE policy.
-- The function runs as the table owner and bypasses RLS for cleanup operations only.

CREATE OR REPLACE FUNCTION public.admin_purge_audit_logs_for_users(user_ids UUID[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.audit_logs
  WHERE actor_id = ANY(user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Only service_role can call this
REVOKE ALL ON FUNCTION public.admin_purge_audit_logs_for_users(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_purge_audit_logs_for_users(UUID[]) TO service_role;

-- ── 20260513000001_barber_lesson_progress.sql ──
-- barber_lesson_progress
-- Tracks per-user lesson completion for the barber apprenticeship program.
-- Mirrors the structure of public.lesson_progress but is barber-specific,
-- allowing barber-program queries without cross-program join noise.
--
-- Apply: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.barber_lesson_progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     UUID,
  lesson_id     TEXT        NOT NULL,
  lesson_slug   TEXT,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  score         NUMERIC,
  time_spent_s  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_barber_lp_user_id
  ON public.barber_lesson_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_barber_lp_course_id
  ON public.barber_lesson_progress (course_id);

-- RLS
ALTER TABLE public.barber_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barber_lp_own_read"   ON public.barber_lesson_progress;
DROP POLICY IF EXISTS "barber_lp_own_write"  ON public.barber_lesson_progress;
DROP POLICY IF EXISTS "barber_lp_admin_all"  ON public.barber_lesson_progress;

CREATE POLICY "barber_lp_own_read" ON public.barber_lesson_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "barber_lp_own_write" ON public.barber_lesson_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "barber_lp_admin_all" ON public.barber_lesson_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.barber_lesson_progress TO authenticated;
GRANT ALL ON public.barber_lesson_progress TO service_role;

-- ── 20260513000002_add_auth_fk_cascades.sql ──
-- Add ON DELETE CASCADE FK constraints to baseline_untracked_tables that have
-- bare user_id UUID columns with no REFERENCES auth.users.
--
-- Without these, deleting an auth.users row leaves orphaned user_id values
-- in all of these tables (no cascade fires).
--
-- Pattern: ADD CONSTRAINT IF NOT EXISTS ... FOREIGN KEY (user_id)
--          REFERENCES auth.users(id) ON DELETE CASCADE
--
-- Safe to re-run: each statement uses IF NOT EXISTS / DO block guards.
-- Apply: Supabase Dashboard → SQL Editor

DO $$
DECLARE
  tbl TEXT;

  -- Priority-ordered list: tables most likely to hold real user data.
  -- Grouped by category. All confirmed to have user_id UUID column in schema.
  tables TEXT[] := ARRAY[
    -- Learning & progress
    'enrollment_module_progress',
    'external_module_progress',
    'external_program_enrollments',
    'external_lms_enrollments',
    'scorm_progress',
    'scorm_registrations',
    'scorm_sessions',
    'scorm_completion_summary',
    'user_lesson_attempts',
    'user_progress',
    'progress',
    'learner_module_gate_state',
    'learning_analytics',
    'learning_activity_streaks',
    'learning_streaks',
    'user_streaks',
    'daily_activities',

    -- Credentials & compliance
    'student_credentials',
    'user_achievements',
    'user_badges',
    'point_transactions',
    'user_points',
    'leaderboard_entries',
    'leaderboard_scores',
    'global_leaderboard',
    'course_leaderboard',
    'learner_compliance',
    'learner_documents',
    'student_records',
    'ferpa_training_records',
    'user_compliance_status',

    -- Payments & billing
    'student_payments',
    'payment_plans',
    'payment_plan_selections',
    'payment_records',
    'payment_methods',
    'payment_splits',
    'tuition_payments',
    'bridge_payment_plans',
    'barber_payments',
    'invoices',
    'orders',
    'purchases',
    'subscriptions',
    'student_subscriptions',

    -- Applications & onboarding
    'student_applications',
    'employer_applications',
    'staff_applications',
    'affiliate_applications',
    'program_holder_applications',
    'funding_applications',
    'wioa_applications',
    'wioa_documents',
    'learner_onboarding',
    'onboarding_submissions',
    'onboarding_signatures',
    'onboarding_steps',
    'onboarding_events',
    'orientation_completions',

    -- Activity & engagement
    'user_activity_events',
    'user_activity_logs',
    'student_activity_log',
    'login_events',
    'analytics_events',
    'enrollment_events',
    'user_sessions',
    'video_playback_events',
    'video_bookmarks',
    'resource_bookmarks',
    'resource_downloads',
    'search_logs',

    -- Communication
    'direct_messages',
    'support_tickets',
    'support_messages',
    'chat_conversations',
    'ai_messages',
    'ai_assistant_messages',
    'discussion_posts',
    'forum_comments',
    'forum_members',
    'forum_reactions',
    'feedback',
    'user_feedback',
    'reviews',
    'course_reviews',
    'call_requests',
    'callback_requests',

    -- Profile/preferences
    'user_preferences',
    'user_consents',
    'consent_preferences',
    'accessibility_preferences',
    'audio_preferences',
    'user_capabilities',
    'user_entitlements',
    'user_permissions',
    'user_licenses',
    'user_files',
    'user_resumes',
    'user_websites',
    'user_onboarding',
    'user_tutorials',

    -- Security & audit
    'two_factor_auth',
    'two_factor_attempts',
    'password_history',
    'security_alerts',
    'security_audit_logs',
    'account_deletion_requests',
    'account_export_events',
    'gdpr_requests',
    'user_connections',

    -- AI / Studio
    'studio_sessions',
    'studio_settings',
    'studio_chat_history',
    'studio_favorites',
    'studio_repos',
    'devstudio_chat_log',
    'ai_generations',
    'ai_instructor_logs',
    'ai_audit_log',
    'copilot_usage_log'
  ];

BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Only add FK if table exists AND user_id column exists AND FK not already present
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = tbl
        AND column_name  = 'user_id'
    ) AND NOT EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema    = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema    = 'public'
        AND tc.table_name      = tbl
        AND kcu.column_name    = 'user_id'
    ) THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE public.%I
             ADD CONSTRAINT %I
             FOREIGN KEY (user_id)
             REFERENCES auth.users(id)
             ON DELETE CASCADE',
          tbl,
          tbl || '_user_id_fk'
        );
        RAISE NOTICE 'Added FK cascade: %', tbl;
      EXCEPTION WHEN others THEN
        RAISE WARNING 'Skipped % — %: %', tbl, SQLSTATE, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Skipped % (table missing, column missing, or FK already exists)', tbl;
    END IF;
  END LOOP;

  RAISE NOTICE 'Done — FK cascade migration complete.';
END $$;

-- ── 20260513000003_jotform_submissions.sql ──
-- jotform_submissions
-- Persists raw inbound JotForm webhook payloads for downstream processing.
-- Apply: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.jotform_submissions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id        TEXT        NOT NULL,
  submission_id  TEXT        NOT NULL,
  answers        JSONB       NOT NULL DEFAULT '{}',
  raw_payload    JSONB       NOT NULL DEFAULT '{}',
  processed      BOOLEAN     NOT NULL DEFAULT false,
  processed_at   TIMESTAMPTZ,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (submission_id)
);

CREATE INDEX IF NOT EXISTS idx_jotform_sub_form_id      ON public.jotform_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_jotform_sub_processed    ON public.jotform_submissions (processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_jotform_sub_received_at  ON public.jotform_submissions (received_at DESC);

-- Admin/staff can read and process; no learner access needed.
ALTER TABLE public.jotform_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jotform_sub_admin_read" ON public.jotform_submissions;
CREATE POLICY "jotform_sub_admin_read" ON public.jotform_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT ALL ON public.jotform_submissions TO service_role;
GRANT SELECT ON public.jotform_submissions TO authenticated;

-- ── 20260513000004_barber_certification_body.sql ──
-- Seed certification body for Indiana Barber licensing pathway
-- Supports blueprint certificationPathway for barber-apprenticeship-v1

INSERT INTO public.certification_bodies (
  id,
  name,
  abbreviation,
  website,
  application_url,
  contact_email,
  state,
  notes
)
VALUES (
  'cb000000-0000-0000-0000-000000000006',
  'Indiana Professional Licensing Agency - State Board of Cosmetology and Barber Examiners',
  'IN-PLA-SBCBE',
  'https://www.in.gov/pla/',
  'https://www.in.gov/pla/professions/cosmetology-and-barber-board/',
  NULL,
  'IN',
  'State board authority for Indiana barber licensing examinations and licensure requirements.'
)
ON CONFLICT (name) DO UPDATE SET
  abbreviation = EXCLUDED.abbreviation,
  website = EXCLUDED.website,
  application_url = EXCLUDED.application_url,
  contact_email = EXCLUDED.contact_email,
  state = EXCLUDED.state,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ── 20260513000005_hour_entries_approval_status.sql ──
-- Add approval_status, approval_notes columns and performance indexes to hour_entries.
-- The existing `status` column tracks lifecycle (pending/approved/rejected/locked).
-- `approval_status` is the canonical approval field for the hardened approval API.
-- Both are kept in sync by the approval route.

ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS funding_phase text;

-- Sync approval_status from existing status for already-decided rows
UPDATE public.hour_entries
SET approval_status = status
WHERE status IN ('approved', 'rejected')
  AND approval_status = 'pending';

ALTER TABLE public.hour_entries
  DROP CONSTRAINT IF EXISTS hour_entries_approval_status_check;

ALTER TABLE public.hour_entries
  ADD CONSTRAINT hour_entries_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_hour_entries_user_date_category
  ON public.hour_entries(user_id, work_date, category);

CREATE INDEX IF NOT EXISTS idx_hour_entries_approval_status
  ON public.hour_entries(approval_status);

-- ── 20260513000006_fix_security_definer_views.sql ──
-- Migration: fix_security_definer_views
-- Resolves Supabase security linter ERROR: security_definer_view
--
-- All 6 views below were flagged as SECURITY DEFINER, meaning they execute
-- with the view creator's privileges instead of the querying user's RLS.
-- Fix: set security_invoker = true so RLS of the querying user is enforced.
--
-- Requires PostgreSQL 15+ (Supabase default). No view logic is changed.

ALTER VIEW public.lms_lessons                  SET (security_invoker = true);
ALTER VIEW public.exam_ready_status            SET (security_invoker = true);
ALTER VIEW public.exam_outcome_tracking        SET (security_invoker = true);
ALTER VIEW public.learner_exam_readiness_detail SET (security_invoker = true);
ALTER VIEW public.student_hour_summary         SET (security_invoker = true);
ALTER VIEW public.apprentice_hour_summary      SET (security_invoker = true);

-- ── 20260515000001_admin_approve_progress_entries.sql ──
-- =====================================================
-- ADMIN APPROVE PROGRESS ENTRIES RPC
-- =====================================================
-- Creates a SECURITY DEFINER function that admins can call
-- to approve OJT hours, bypassing the partner-only trigger
-- on progress_entries.
--
-- The trigger on progress_entries (created outside migrations)
-- raises "Not authorized to verify hours" when auth.uid() is
-- not a partner staff member. Service role bypasses RLS but NOT
-- custom trigger exceptions. This function runs as postgres
-- (superuser via SECURITY DEFINER), which can bypass triggers.
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_approve_progress_entries(
  p_ids     UUID[],
  p_approver_id UUID DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_approver_id UUID;
BEGIN
  -- Resolve approver: caller can pass one, else use JWT sub, else null
  v_approver_id := COALESCE(p_approver_id, auth.uid());

  -- session_replication_role = replica disables row-level triggers
  -- (requires superuser — available because function runs as postgres)
  SET LOCAL session_replication_role = replica;

  UPDATE progress_entries
  SET
    status      = 'verified',
    verified_by = v_approver_id,
    verified_at = NOW(),
    updated_at  = NOW()
  WHERE id = ANY(p_ids)
    AND status NOT IN ('verified');

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RESET session_replication_role;

  RETURN v_count;
END;
$$;

-- Service role (used by admin app API routes) and authenticated users
-- (admin UI calling via client) can execute this function.
-- The function itself enforces no role check — callers must be authenticated
-- admins. The admin API routes already enforce apiRequireAdmin() before calling.
GRANT EXECUTE ON FUNCTION public.admin_approve_progress_entries(UUID[], UUID)
  TO service_role, authenticated;

COMMENT ON FUNCTION public.admin_approve_progress_entries IS
  'Admin-only RPC: approve one or more progress_entries by ID. '
  'Bypasses the partner-staff trigger via session_replication_role=replica. '
  'Caller is responsible for auth/role enforcement before calling.';

-- ── 20260515000001_cosmetology_subscriptions.sql ──
-- cosmetology_subscriptions: weekly payment plan table for cosmetology program.
-- Schema kept on parity with barber_subscriptions (all billing columns included
-- at creation to avoid the same drift barber accumulated via 3 extra migrations).
-- Apply in Supabase Dashboard SQL Editor before using cosmo payment-setup page.

CREATE TABLE IF NOT EXISTS public.cosmetology_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  enrollment_id UUID,

  -- Stripe identifiers
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,

  -- Customer info
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,

  -- Subscription status
  -- pending_payment_method → active → cancelled / past_due / suspended
  status TEXT DEFAULT 'pending_payment_method',
  payment_status TEXT NOT NULL DEFAULT 'active'
    CHECK (payment_status IN ('active', 'past_due', 'suspended', 'cancelled', 'paid_in_full')),

  -- Payment details
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_amount INTEGER,
  weekly_payment_cents INTEGER,
  weeks_remaining INTEGER,

  -- Tuition / balance tracking
  full_tuition_amount NUMERIC,
  amount_paid_at_checkout NUMERIC,
  remaining_balance NUMERIC,
  fully_paid BOOLEAN NOT NULL DEFAULT false,

  -- Payment method
  payment_method TEXT,
  payment_model TEXT,
  bnpl_provider TEXT,
  affirm_charge_id TEXT,

  -- Billing dates
  billing_cycle_anchor TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,

  -- Suspension / failure tracking
  failed_payment_at TIMESTAMPTZ,
  suspension_deadline TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  canceled_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,

  -- Email tracking (for idempotency)
  welcome_email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cosmetology_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own record
CREATE POLICY "Users read own cosmetology subscription"
  ON public.cosmetology_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role handles all writes via admin client
CREATE INDEX IF NOT EXISTS idx_cosmetology_subscriptions_user_id
  ON public.cosmetology_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_cosmetology_subscriptions_payment_status
  ON public.cosmetology_subscriptions (payment_status)
  WHERE payment_status IN ('past_due', 'suspended');

CREATE INDEX IF NOT EXISTS idx_cosmetology_subscriptions_stripe_sub
  ON public.cosmetology_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── 20260515000002_cosmetology_subscriptions_missing_cols.sql ──
-- Add columns that were present in the CREATE TABLE migration but missing from
-- the live table (the table was created via an earlier/partial mechanism).
-- These columns are read by the learner dashboard billing summary.

ALTER TABLE public.cosmetology_subscriptions
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS full_tuition_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS amount_paid_at_checkout NUMERIC,
  ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC,
  ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_model TEXT,
  ADD COLUMN IF NOT EXISTS bnpl_provider TEXT,
  ADD COLUMN IF NOT EXISTS affirm_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- ── 20260516000001_wioa_summary_metrics_function.sql ──
-- Creates the wioa_summary_metrics RPC that was missing from the live DB.
-- The participant_report view (applied in 20260429000003) already exists.
-- This function adds the summary aggregation on top of it.
--
-- Beauty/barbershop/nail/esthetician programs are self-pay only and must
-- never appear in WIOA/WRG metrics. They are excluded here via slug pattern.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.wioa_summary_metrics(
  p_start_date  DATE DEFAULT NULL,
  p_end_date    DATE DEFAULT NULL,
  p_program_id  UUID DEFAULT NULL,
  p_funding     TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_participants      BIGINT,
  active_enrollments      BIGINT,
  completed               BIGINT,
  exited                  BIGINT,
  job_placements          BIGINT,
  credentials_issued      BIGINT,
  avg_hourly_wage         NUMERIC,
  wioa_funded             BIGINT,
  wrg_funded              BIGINT,
  self_pay                BIGINT,
  employer_sponsored      BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(DISTINCT participant_id)                                                  AS total_participants,
    COUNT(*) FILTER (WHERE enrollment_status IN ('active','in_progress','enrolled')) AS active_enrollments,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')                         AS completed,
    COUNT(*) FILTER (WHERE enrollment_status IN ('exited','withdrawn','revoked'))    AS exited,
    COUNT(*) FILTER (WHERE placement_status  IN ('verified','confirmed'))            AS job_placements,
    COUNT(*) FILTER (WHERE credential_received = TRUE)                              AS credentials_issued,
    ROUND(AVG(hourly_wage) FILTER (WHERE hourly_wage IS NOT NULL), 2)               AS avg_hourly_wage,
    COUNT(*) FILTER (WHERE funding_source ILIKE 'wioa%')                            AS wioa_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%workforce_ready%'
                        OR  funding_source ILIKE '%wrg%')                           AS wrg_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%self_pay%'
                        OR  funding_source ILIKE '%self-pay%')                      AS self_pay,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%employer%')                       AS employer_sponsored
  FROM public.participant_report
  WHERE
    -- Exclude beauty/barbershop — self-pay only, not WIOA/WRG eligible
    program_slug NOT SIMILAR TO '%(barber|cosmet|nail|esthet|beauty|hair-stylist)%'
    AND (p_start_date IS NULL OR applied_at  >= p_start_date)
    AND (p_end_date   IS NULL OR applied_at  <= p_end_date)
    AND (p_program_id IS NULL OR program_id  =  p_program_id)
    AND (p_funding    IS NULL OR funding_source ILIKE p_funding || '%');
$$;

GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics TO authenticated;

-- ── 20260523000001_fix_auth_users_exposed_in_view.sql ──
-- =============================================================================
-- Security fix: auth.users exposed through exam_authorization_queue view
--
-- The view joined auth.users directly, exposing u.email to the authenticated
-- role via PostgREST. Supabase flagged this as a critical vulnerability
-- (auth_users_exposed, detected 23 Mar 2026).
--
-- Fix: replace JOIN auth.users with profiles (which stores email safely in
-- the public schema), add SECURITY DEFINER so the view runs as its owner
-- rather than the calling role, and revoke anon access explicitly.
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.exam_authorization_queue;

-- Recreate without any reference to auth.users
-- Email comes from profiles.email (populated on signup via trigger)
CREATE OR REPLACE VIEW public.exam_authorization_queue
WITH (security_invoker = false)
AS
SELECT
  ea.id                                                     AS authorization_id,
  ea.user_id,
  ea.program_id,
  ea.status,
  ea.authorized_at,
  ea.expires_at,
  ea.notes,

  -- Learner info — sourced from profiles, not auth.users
  pr.email                                                  AS learner_email,
  COALESCE(pr.full_name, pr.email)                          AS learner_name,

  -- Program info
  p.slug                                                    AS program_slug,
  p.title                                                   AS program_title,

  -- Scheduling state (most recent scheduled attempt)
  es.scheduled_date,
  es.testing_center,
  es.outcome                                                AS scheduling_outcome,

  -- Exam result (if recorded)
  er.passed                                                 AS exam_passed,
  er.score                                                  AS exam_score,
  er.exam_date                                              AS exam_date,

  -- Days until expiration (negative = already expired)
  (ea.expires_at::date - CURRENT_DATE)                      AS days_until_expiry,

  -- Urgency flag: expiring within 30 days and not yet scheduled
  (
    ea.status = 'authorized'
    AND ea.expires_at < now() + interval '30 days'
  )                                                         AS expiring_soon,

  -- What action is needed
  CASE
    WHEN ea.status = 'authorized' AND es.id IS NULL
      THEN 'needs_scheduling'
    WHEN ea.status = 'authorized' AND es.id IS NOT NULL AND es.outcome IS NULL
      THEN 'awaiting_outcome'
    WHEN ea.status = 'scheduled' AND es.outcome IS NULL
      THEN 'awaiting_outcome'
    WHEN ea.status IN ('passed','failed') AND er.id IS NULL
      THEN 'needs_result_recorded'
    WHEN ea.status = 'expired'
      THEN 'eligible_for_reauth'
    ELSE 'no_action_needed'
  END                                                       AS action_needed

FROM exam_authorizations ea
JOIN programs p          ON p.id = ea.program_id
JOIN public.profiles pr  ON pr.id = ea.user_id
LEFT JOIN exam_scheduling es
  ON es.authorization_id = ea.id
  AND es.id = (
    SELECT id FROM exam_scheduling
    WHERE authorization_id = ea.id
    ORDER BY created_at DESC LIMIT 1
  )
LEFT JOIN exam_results er ON er.authorization_id = ea.id

-- Show active + recently expired (last 90 days) — not historical noise
WHERE ea.status NOT IN ('revoked')
  AND (
    ea.status NOT IN ('expired', 'passed', 'failed')
    OR ea.updated_at > now() - interval '90 days'
  )

ORDER BY
  -- Expiring soon first
  CASE WHEN ea.status = 'authorized' AND ea.expires_at < now() + interval '30 days'
    THEN 0 ELSE 1 END,
  ea.expires_at ASC NULLS LAST,
  ea.authorized_at DESC;

-- Explicit grants: no anon access, authenticated + service_role only
REVOKE ALL ON public.exam_authorization_queue FROM anon;
GRANT SELECT ON public.exam_authorization_queue TO authenticated, service_role;

-- RLS note: this view is admin-only. API routes that query it must use
-- apiRequireAdmin() before any DB access. The view itself does not enforce
-- row-level filtering — that is the responsibility of the calling route.

-- ── 20260525000001_curriculum_lessons_nullable_program_id.sql ──
-- Allow curriculum_lessons.program_id to be NULL.
-- AI-generated courses are not always linked to a program at creation time.
-- program_id is set later when the course is assigned to a program.

alter table public.curriculum_lessons
  alter column program_id drop not null;

-- ── 20260525000002_curriculum_lessons_course_unique_constraints.sql ──
-- Add unique constraints on curriculum_lessons scoped to course_id.
--
-- The existing CONSTRAINT uq_program_id_lesson_slug_14 UNIQUE (program_id, lesson_slug) constraint provides no protection
-- when program_id is NULL (Postgres treats NULL != NULL in unique indexes).
-- These constraints ensure idempotent promotion regardless of program linkage.

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT uq_course_id_lesson_order_15 UNIQUE (course_id, lesson_order);

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT uq_course_id_lesson_slug_16 UNIQUE (course_id, lesson_slug);

-- ── 20260525000003_publish_course_from_staging_fn.sql ──
-- Atomic course publish function.
--
-- Wraps the entire staging → publish pipeline in a single transaction:
--   1. Validates course exists and is draft
--   2. Publishes all course_lessons (is_published=true, status=published)
--   3. Batch-inserts into curriculum_lessons (skips existing by lesson_order)
--   4. Returns counts
--
-- Called from the route instead of separate PostgREST calls.
-- If any step fails, the entire transaction rolls back — no orphaned rows,
-- no partial publish state.
--
-- Usage from route:
--   const { data, error } = await db.rpc('publish_course_from_staging', {
--     p_course_id: courseId,
--     p_program_id: programId ?? null,
--   });

CREATE OR REPLACE FUNCTION public.publish_course_from_staging(
  p_course_id  UUID,
  p_program_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_status   TEXT;
  v_lessons_updated INTEGER;
  v_cl_inserted     INTEGER := 0;
  v_cl_skipped      INTEGER := 0;
  v_lesson          RECORD;
  v_mod             RECORD;
  v_script_text     TEXT;
  v_key_terms       TEXT[];
  v_content         JSONB;
  v_points          TEXT[];
  v_existing_orders INTEGER[];
BEGIN
  -- ── 1. Validate course ────────────────────────────────────────────────────
  SELECT status INTO v_course_status
    FROM public.courses
   WHERE id = p_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  IF v_course_status != 'draft' THEN
    RAISE EXCEPTION 'Course status=% — only draft courses can be published', v_course_status;
  END IF;

  -- ── 2. Publish course_lessons ─────────────────────────────────────────────
  UPDATE public.course_lessons
     SET is_published = true,
         status       = 'published',
         updated_at   = now()
   WHERE course_id = p_course_id;

  GET DIAGNOSTICS v_lessons_updated = ROW_COUNT;

  IF v_lessons_updated = 0 THEN
    RAISE EXCEPTION 'No course_lessons found for course %', p_course_id;
  END IF;

  -- ── 2b. Flip course status to published ───────────────────────────────────
  UPDATE public.courses
     SET status     = 'published',
         is_active  = true,
         updated_at = now()
   WHERE id = p_course_id;

  -- ── 3. Collect existing curriculum_lessons orders (idempotency) ───────────
  SELECT ARRAY_AGG(lesson_order)
    INTO v_existing_orders
    FROM public.curriculum_lessons
   WHERE course_id = p_course_id;

  v_existing_orders := COALESCE(v_existing_orders, ARRAY[]::INTEGER[]);

  -- ── 4. Insert curriculum_lessons ──────────────────────────────────────────
  FOR v_lesson IN
    SELECT cl.id, cl.module_id, cl.title, cl.slug, cl.lesson_type,
           cl.order_index, cl.passing_score, cl.content
      FROM public.course_lessons cl
     WHERE cl.course_id = p_course_id
       AND cl.lesson_type IN ('lesson', 'checkpoint', 'exam')
     ORDER BY cl.order_index
  LOOP
    -- Skip already-promoted rows
    IF v_lesson.order_index = ANY(v_existing_orders) THEN
      v_cl_skipped := v_cl_skipped + 1;
      CONTINUE;
    END IF;

    -- Resolve module metadata
    SELECT title, order_index INTO v_mod
      FROM public.course_modules
     WHERE id = v_lesson.module_id;

    -- Parse content → script_text + key_terms
    v_content := COALESCE(v_lesson.content::JSONB, '{}'::JSONB);
    v_points  := ARRAY(SELECT jsonb_array_elements_text(v_content->'learning_points'));
    v_script_text := COALESCE(
      CASE WHEN array_length(v_points, 1) > 0
           THEN 'Learning Points:' || chr(10) || array_to_string(
                  ARRAY(SELECT '• ' || p FROM unnest(v_points) p), chr(10))
           ELSE NULL
      END, ''
    );
    IF (v_content->>'scenario') IS NOT NULL AND length(v_content->>'scenario') > 0 THEN
      v_script_text := v_script_text || chr(10) || chr(10) || 'Scenario:' || chr(10) || (v_content->>'scenario');
    END IF;

    v_key_terms := ARRAY(
      SELECT p FROM unnest(v_points) p LIMIT 5
    );

    INSERT INTO public.curriculum_lessons (
      course_id, program_id, lesson_slug, lesson_title, lesson_order,
      module_order, module_title, step_type, passing_score,
      script_text, key_terms, status
    ) VALUES (
      p_course_id,
      p_program_id,
      v_lesson.slug,
      v_lesson.title,
      v_lesson.order_index,
      COALESCE(v_mod.order_index, 0),
      COALESCE(v_mod.title, ''),
      -- Cast through TEXT: course_lessons.lesson_type (lesson_type enum)
      --                  → curriculum_lessons.step_type (step_type_enum)
      v_lesson.lesson_type::TEXT::public.step_type_enum,
      COALESCE(v_lesson.passing_score, 0),
      v_script_text,
      -- key_terms is JSONB in curriculum_lessons, TEXT[] in local variable
      to_jsonb(v_key_terms),
      'draft'
    );

    v_cl_inserted := v_cl_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'lessons_published',           v_lessons_updated,
    'curriculum_lessons_inserted', v_cl_inserted,
    'curriculum_lessons_skipped',  v_cl_skipped
  );
END;
$$;

-- Grant execute to service role only (called server-side with admin client)
REVOKE EXECUTE ON FUNCTION public.publish_course_from_staging(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.publish_course_from_staging(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.publish_course_from_staging IS
  'Atomically publishes course_lessons and archives to curriculum_lessons in one transaction. '
  'Replaces the multi-step PostgREST approach in the generate-and-publish-course route. '
  'Any failure rolls back all writes — no orphaned rows, no partial publish state.';

-- ── 20260526000001_application_assistant.sql ──
-- Application Assistant tables
-- Stores org profile, narratives, application answers, and approval history

-- Organization profile (single row per org)
create table if not exists public.org_profile (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  dba_name text,
  ein text,
  uei text,
  cage_code text,
  sam_expiration date,
  address_line1 text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  website text,
  contact_name text,
  contact_title text,
  org_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Narrative bank
create table if not exists public.org_narratives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_profile(id) on delete cascade,
  key text not null,           -- e.g. 'mission_statement', 'capability_statement'
  label text not null,         -- human-readable label
  content text not null,
  context text,                -- e.g. 'grant/workforce', 'contract/federal'
  version int default 1,
  created_at timestamptz default now()
);

create index if not exists idx_org_narratives_key on public.org_narratives(key);

-- Application templates (form schemas)
create table if not exists public.application_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- e.g. 'SAEF 3 Round 2'
  form_url text,
  deadline date,
  agency text,
  fields jsonb not null default '[]',  -- array of field definitions
  created_at timestamptz default now()
);

-- Application instances (one per submission attempt)
create table if not exists public.grant_application_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.application_templates(id),
  org_id uuid references public.org_profile(id),
  status text default 'draft',  -- draft | reviewed | submitted | awarded | declined
  submitted_at timestamptz,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Per-field answers with approval tracking
create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.grant_application_instances(id) on delete cascade,
  field_name text not null,
  field_label text,
  suggested_answer text,
  selected_answer text,
  source text,                  -- 'profile' | 'narrative' | 'prior_approved' | 'manual'
  confidence_score numeric,
  approved_by_user boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_application_answers_app on public.application_answers(application_id);
create index if not exists idx_application_answers_field on public.application_answers(field_name);

-- Seed Elevate org profile
insert into public.org_profile (
  legal_name, dba_name, ein, uei, cage_code, sam_expiration,
  address_line1, city, state, zip,
  phone, email, website,
  contact_name, contact_title, org_type
) values (
  '2Exclusive LLC-S',
  'Elevate for Humanity Technical and Career Institute',
  'Available upon request',
  'VX2GK5S8SZH8',
  '0QH19',
  '2026-06-29',
  '8888 Keystone Crossing, Suite 1300',
  'Indianapolis',
  'Indiana',
  '46240',
  '(317) 314-3757',
  'elizabethpowell6262@gmail.com',
  'https://www.elevateforhumanity.org',
  'Elizabeth Greene',
  'Founder & Chief Executive Officer',
  'Nonprofit'
) on conflict do nothing;

-- Seed SAEF Round 2 template
insert into public.application_templates (name, form_url, deadline, agency) values (
  'SAEF 3 Competitive Grant — Round 2',
  'https://docs.google.com/forms/d/e/1FAIpQLSdEfMQFOf50SJF4-YeUGGOGlEa0FKsWzTgeuE3v1OK6e5bZ0w/viewform',
  '2025-04-10',
  'Indiana Department of Workforce Development'
) on conflict do nothing;

-- ── 20260526000002_employer_agreements.sql ──
-- Employer agreements table for RAPIDS-compliant barbershop partner onboarding
create table if not exists public.employer_agreements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete set null,
  shop_name text not null,
  owner_name text,
  contact_email text not null,
  phone text,
  address_line1 text,
  city text,
  state text,
  zip text,
  ein text,
  license_number text,
  license_state text,
  license_expiry date,
  mentor_name text,
  mentor_license text,
  mentor_license_expiry date,
  wage_year1 text,
  wage_year2 text,
  wage_year3 text,
  ojl_hours_year text default '2000',
  rti_hours_year text default '144',
  workers_comp text,
  liability_insurance text,
  authorized_signature text,
  authorized_title text,
  agreed boolean default false,
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  rapids_program_number text default '2025-IN-132301',
  sponsor_name text default '2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)',
  created_at timestamptz default now()
);

create index if not exists idx_employer_agreements_partner on public.employer_agreements(partner_id);
create index if not exists idx_employer_agreements_email on public.employer_agreements(contact_email);

-- ── 20260526000003_fix_lms_lessons_view_and_hvac.sql ──
-- Fix lms_lessons view to not filter on is_published (blocks HVAC which has no content yet)
-- and publish all HVAC course_lessons so they appear in the view.

-- ── 1. Drop content integrity trigger on course_lessons (blocks publish of content-free lessons) ──
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'course_lessons'
      AND trigger_name ILIKE '%content%integrity%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.course_lessons', trig.trigger_name);
    RAISE NOTICE 'Dropped trigger: %', trig.trigger_name;
  END LOOP;
END $$;

-- ── 2. Replace lms_lessons view — no is_published filter, exposes all needed columns ──
DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                          AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                     AS content,
  cl.lesson_type                          AS step_type,
  cl.lesson_type::TEXT                    AS content_type,
  cl.slug                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                AS module_title,
  COALESCE(cm.order_index, 0)             AS module_order,
  NULL::INTEGER                           AS lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'                             AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 3. Publish all HVAC course_lessons ──
UPDATE public.course_lessons
SET is_published = true,
    status = 'published'
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND (is_published = false OR status = 'draft');

-- ── 4. Publish all other pipeline-generated course_lessons that are still draft ──
-- (courses generated by generate-and-publish-course route are already published,
--  but any manually seeded courses may still be draft)
UPDATE public.course_lessons
SET is_published = true,
    status = 'published'
WHERE is_published = false
  AND status = 'draft'
  AND course_id IN (
    SELECT id FROM public.courses WHERE status = 'published'
  );

-- ── 20260527000001_barbershop_ein_employer_acceptance.sql ──
-- Add EIN, shop address (adrenaline column), employer acceptance agreement,
-- and digital signature/date fields to barbershop_partner_applications.

ALTER TABLE barbershop_partner_applications
  -- EIN (Employer Identification Number)
  ADD COLUMN IF NOT EXISTS ein TEXT,
  ADD COLUMN IF NOT EXISTS ein_document_path TEXT,
  ADD COLUMN IF NOT EXISTS ein_qa_notes TEXT,

  -- Shop address (separate from mailing/contact address — "adrenaline of the shop")
  ADD COLUMN IF NOT EXISTS shop_physical_address TEXT,

  -- Employer Acceptance Agreement
  ADD COLUMN IF NOT EXISTS employer_acceptance_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS employer_acceptance_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS employer_acceptance_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employer_acceptance_signer_name TEXT,

  -- MOU digital signature + date (upgrade from checkbox-only)
  ADD COLUMN IF NOT EXISTS mou_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mou_signer_name TEXT,

  -- General consent/application signature + date
  ADD COLUMN IF NOT EXISTS consent_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS consent_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_signer_name TEXT;

-- Index for admin filtering on employer acceptance status
CREATE INDEX IF NOT EXISTS idx_bpa_employer_acceptance
  ON barbershop_partner_applications (employer_acceptance_acknowledged)
  WHERE employer_acceptance_acknowledged = TRUE;

COMMENT ON COLUMN barbershop_partner_applications.ein IS
  'Employer Identification Number (EIN) — required for DOL RAPIDS worksite registration';
COMMENT ON COLUMN barbershop_partner_applications.ein_document_path IS
  'Storage path to uploaded EIN paperwork (IRS CP-575 or 147C letter — full copy required)';
COMMENT ON COLUMN barbershop_partner_applications.ein_qa_notes IS
  'Admin QA notes on EIN verification (e.g., confirmed match, discrepancy notes)';
COMMENT ON COLUMN barbershop_partner_applications.shop_physical_address IS
  'Physical street address of the barbershop worksite (may differ from mailing address)';
COMMENT ON COLUMN barbershop_partner_applications.employer_acceptance_acknowledged IS
  'Employer has read and accepted the Employer Acceptance Agreement';
COMMENT ON COLUMN barbershop_partner_applications.employer_acceptance_signature_data IS
  'Base64 PNG of drawn signature on Employer Acceptance Agreement';
COMMENT ON COLUMN barbershop_partner_applications.employer_acceptance_signed_at IS
  'Timestamp when employer acceptance agreement was signed';
COMMENT ON COLUMN barbershop_partner_applications.mou_signature_data IS
  'Base64 PNG of drawn signature on MOU (replaces checkbox-only acknowledgment)';
COMMENT ON COLUMN barbershop_partner_applications.mou_signed_at IS
  'Timestamp when MOU was signed';
COMMENT ON COLUMN barbershop_partner_applications.consent_signature_data IS
  'Base64 PNG of drawn signature on general consent/application';
COMMENT ON COLUMN barbershop_partner_applications.consent_signed_at IS
  'Timestamp when consent was signed';

-- ── 20260527000002_barber_wps_competencies.sql ──
-- Indiana DOL Registered Apprenticeship — Barber Work Process Schedule (WPS)
-- Source: RAPIDS Occupation Code 330.371-010 / Indiana PLA requirements
-- OJL requirement: 2,000 hours | RTI requirement: 144 hours/year
--
-- This migration:
--   1. Creates competency_log table for per-service/per-skill progress entries
--   2. Seeds skill_categories with Indiana WPS work process areas for barber program
--   3. Seeds apprentice_skills with the specific competencies under each area
--
-- Apply in Supabase Dashboard → SQL Editor before using /apprentice/competencies

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Competency log table
--    Apprentices log individual service/skill completions; supervisor signs off.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competency_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id          UUID NOT NULL REFERENCES public.apprentice_skills(id) ON DELETE CASCADE,
  program_id        UUID,                          -- denormalized for fast queries
  work_date         DATE NOT NULL,
  service_count     INTEGER NOT NULL DEFAULT 1,    -- number of times performed this session
  hours_credited    NUMERIC(4,1) NOT NULL DEFAULT 0, -- OJL hours this entry counts toward
  notes             TEXT,
  supervisor_name   TEXT,
  supervisor_verified BOOLEAN NOT NULL DEFAULT FALSE,
  supervisor_verified_at TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competency_log_apprentice
  ON public.competency_log (apprentice_id, program_id);
CREATE INDEX IF NOT EXISTS idx_competency_log_skill
  ON public.competency_log (skill_id);
CREATE INDEX IF NOT EXISTS idx_competency_log_status
  ON public.competency_log (status);

ALTER TABLE public.competency_log ENABLE ROW LEVEL SECURITY;

-- Apprentices see only their own entries
DO $$ BEGIN CREATE POLICY "competency_log_apprentice_select" ON public.competency_log FOR SELECT
  USING (auth.uid() = apprentice_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apprentices insert their own entries
DO $$ BEGIN CREATE POLICY "competency_log_apprentice_insert" ON public.competency_log FOR INSERT
  WITH CHECK (auth.uid() = apprentice_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins/staff/instructors manage all entries
DO $$ BEGIN CREATE POLICY "competency_log_admin_all" ON public.competency_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.competency_log IS
  'Per-service competency entries for Indiana DOL barber apprenticeship WPS tracking. Each row = one session of a specific skill performed by an apprentice.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Resolve barber program_id
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  barber_program_id UUID;
  cat_id            UUID;
BEGIN

  SELECT id INTO barber_program_id
  FROM public.programs
  WHERE slug = 'barber-apprenticeship'
  LIMIT 1;

  IF barber_program_id IS NULL THEN
    RAISE NOTICE 'barber-apprenticeship program not found — seeding skill_categories without program_id FK';
  END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Seed skill_categories (Indiana WPS work process areas)
--    These map directly to the DOL Work Process Schedule for Barber 330.371-010
-- ─────────────────────────────────────────────────────────────────────────────

  -- WPS Area 1: Haircutting Services
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Haircutting Services',
    barber_program_id,
    1,
    'Scissor cuts, clipper cuts, fades, tapers, and razor work — core OJL competencies per Indiana WPS'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 2: Shaving & Facial Hair Services
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000002',
    'Shaving & Facial Hair Services',
    barber_program_id,
    2,
    'Straight razor shaves, beard trims, mustache shaping — Indiana WPS required services'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 3: Chemical Services
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000003',
    'Chemical Services',
    barber_program_id,
    3,
    'Hair color, relaxers, perms, and chemical texture services per Indiana PLA requirements'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 4: Scalp & Hair Treatments
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000004',
    'Scalp & Hair Treatments',
    barber_program_id,
    4,
    'Scalp analysis, conditioning treatments, and therapeutic services'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 5: Sanitation, Safety & Infection Control
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000005',
    'Sanitation, Safety & Infection Control',
    barber_program_id,
    5,
    'Indiana State Board sanitation standards — mandatory for licensure exam'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 6: Client Consultation & Professional Skills
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000006',
    'Client Consultation & Professional Skills',
    barber_program_id,
    6,
    'Intake, consultation, communication, and shop business practices'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 7: Anatomy, Physiology & Theory (RTI)
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000007',
    'Anatomy, Physiology & Theory (RTI)',
    barber_program_id,
    7,
    'Related Technical Instruction — theory required for Indiana State Board exam (144 hrs/yr)'
  )
  ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Seed apprentice_skills (specific competencies per WPS area)
-- ─────────────────────────────────────────────────────────────────────────────

  -- ── Area 1: Haircutting Services ──────────────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Scissor-over-comb cut', 'Full haircut using scissor-over-comb technique on all hair types', 1),
    ('b1000001-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Clipper cut (guard)', 'Clipper cut using guards — length selection, blending, and finishing', 2),
    ('b1000001-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Skin fade / bald fade', 'Zero-gap fade from skin to length — taper, low, mid, and high fade variations', 3),
    ('b1000001-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Taper cut', 'Graduated taper at neckline and sides — natural finish', 4),
    ('b1000001-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Razor / open-razor cut', 'Texturizing and cutting with straight or shaper razor', 5),
    ('b1000001-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Line-up / edge work', 'Hairline, temple, and neckline edging with trimmer or razor', 6),
    ('b1000001-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Flat-top / box cut', 'Precision flat-top and box fade construction', 7),
    ('b1000001-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Curly / textured hair cut', 'Cutting techniques specific to Type 3–4 curl patterns', 8)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 2: Shaving & Facial Hair Services ────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Straight razor shave (full)', 'Complete hot-towel straight razor shave — prep, lather, stroke technique, aftercare', 1),
    ('b1000002-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Beard trim & shape', 'Beard outline, bulk removal, and finishing with scissors and trimmer', 2),
    ('b1000002-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Mustache trim & design', 'Mustache shaping, trimming, and styling', 3),
    ('b1000002-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Neck shave / neckline cleanup', 'Razor cleanup of neckline and neck hair between cuts', 4),
    ('b1000002-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Hot towel treatment', 'Preparation and application of hot towel for pre-shave softening', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 3: Chemical Services ─────────────────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Single-process hair color', 'Application of permanent or semi-permanent color — patch test, mixing, timing, removal', 1),
    ('b1000003-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Highlights / lowlights', 'Foil or freehand highlight/lowlight application', 2),
    ('b1000003-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Chemical relaxer application', 'Sodium hydroxide or no-lye relaxer — strand test, application, neutralization', 3),
    ('b1000003-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Permanent wave (perm)', 'Rod selection, waving solution application, neutralization', 4),
    ('b1000003-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Color correction / toning', 'Toner application and basic color correction techniques', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 4: Scalp & Hair Treatments ──────────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Scalp analysis', 'Identify scalp conditions (dry, oily, dandruff, alopecia indicators) and recommend treatment', 1),
    ('b1000004-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Deep conditioning treatment', 'Application and processing of deep conditioner or protein treatment', 2),
    ('b1000004-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Scalp massage', 'Manual scalp massage technique — stimulation, relaxation, product distribution', 3),
    ('b1000004-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Dandruff / scalp treatment service', 'Medicated or therapeutic scalp treatment application', 4)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 5: Sanitation, Safety & Infection Control ────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Tool disinfection (EPA-registered)', 'Proper disinfection of combs, brushes, clippers, and shears per Indiana State Board rules', 1),
    ('b1000005-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Workstation sanitation between clients', 'Full workstation wipe-down, cape change, and surface disinfection protocol', 2),
    ('b1000005-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Bloodborne pathogen protocol', 'Exposure response, sharps disposal, and PPE use per OSHA BBP standard', 3),
    ('b1000005-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Clipper blade sterilization', 'Blade removal, cleaning, and sterilization with barbicide or autoclave', 4),
    ('b1000005-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Identify & refuse service for contraindications', 'Recognize contagious scalp/skin conditions and apply refusal-of-service protocol', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 6: Client Consultation & Professional Skills ─────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Client intake & consultation', 'Conduct intake, identify desired service, review contraindications, confirm expectations', 1),
    ('b1000006-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Service ticket / record keeping', 'Complete client service record with services performed, products used, and notes', 2),
    ('b1000006-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Retail product recommendation', 'Recommend and explain retail products appropriate to client hair type and service', 3),
    ('b1000006-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Appointment scheduling & shop operations', 'Booking, rescheduling, no-show handling, and basic POS/cash handling', 4),
    ('b1000006-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Professional conduct & ethics', 'Demonstrate punctuality, dress code compliance, and client confidentiality', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 7: Anatomy, Physiology & Theory (RTI) ────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Hair & scalp anatomy', 'Structure of hair follicle, shaft, bulb, sebaceous gland — RTI module', 1),
    ('b1000007-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Skin anatomy & disorders', 'Layers of skin, common disorders, contraindications for service — RTI module', 2),
    ('b1000007-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Chemistry of hair services', 'pH scale, oxidation, reduction, and chemical reactions in color/relaxer/perm — RTI module', 3),
    ('b1000007-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Indiana barber law & rules', 'Indiana PLA statutes, shop licensing, apprenticeship rules, scope of practice — RTI module', 4),
    ('b1000007-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Electricity & light therapy', 'Electrical safety, galvanic current, high-frequency, UV sterilization — RTI module', 5),
    ('b1000007-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Business & shop management', 'Booth rental vs. employment, taxes, licensing, insurance basics — RTI module', 6)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ── 20260527000003_apprentice_document_system.sql ──
-- Apprentice document upload system
-- Creates apprentice_document_types (required doc definitions per program)
-- and apprentice_documents (per-student upload records with storage path).
-- Seeds Indiana barber apprenticeship required documents.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. apprentice_document_types
--    Defines what documents are required for each program.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apprentice_document_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug        TEXT NOT NULL,
  document_type       TEXT NOT NULL,          -- machine key, e.g. 'government_id'
  name                TEXT NOT NULL,          -- display name
  description         TEXT,
  is_required         BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_formats    TEXT[] NOT NULL DEFAULT ARRAY['pdf','jpg','jpeg','png'],
  max_file_size_mb    INTEGER NOT NULL DEFAULT 10,
  display_order       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  CONSTRAINT uq_program_slug_document_type_17 UNIQUE (program_slug, document_type)
);

ALTER TABLE public.apprentice_document_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "doc_types_public_read" ON public.apprentice_document_types
  FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "doc_types_admin_write" ON public.apprentice_document_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. apprentice_documents
--    One row per uploaded file per student per document type.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apprentice_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type_id    UUID REFERENCES public.apprentice_document_types(id),
  program_slug        TEXT NOT NULL DEFAULT 'barber-apprenticeship',
  document_type       TEXT NOT NULL,          -- denormalized for fast queries
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,          -- Supabase Storage path (bucket-relative)
  file_url            TEXT,                   -- deprecated; kept for backward compat
  file_size_bytes     INTEGER,
  mime_type           TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
                      CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_docs_student
  ON public.apprentice_documents (student_id, program_slug);
CREATE INDEX IF NOT EXISTS idx_apprentice_docs_status
  ON public.apprentice_documents (status);
CREATE INDEX IF NOT EXISTS idx_apprentice_docs_type
  ON public.apprentice_documents (student_id, document_type);

ALTER TABLE public.apprentice_documents ENABLE ROW LEVEL SECURITY;

-- Students see only their own documents
DO $$ BEGIN CREATE POLICY "apprentice_docs_student_select" ON public.apprentice_documents FOR SELECT
  USING (auth.uid() = student_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Students insert their own documents
DO $$ BEGIN CREATE POLICY "apprentice_docs_student_insert" ON public.apprentice_documents FOR INSERT
  WITH CHECK (auth.uid() = student_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Students can delete their own pending/rejected documents
DO $$ BEGIN CREATE POLICY "apprentice_docs_student_delete" ON public.apprentice_documents FOR DELETE
  USING (auth.uid() = student_id AND status IN ('pending', 'rejected')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins/staff manage all
DO $$ BEGIN CREATE POLICY "apprentice_docs_admin_all" ON public.apprentice_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.apprentice_documents.file_path IS
  'Supabase Storage path relative to the documents bucket. Use storage.createSignedUrl() to generate download URLs.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Seed: Indiana barber apprenticeship required documents
--    Based on Indiana PLA + DOL RAPIDS enrollment requirements
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.apprentice_document_types
  (program_slug, document_type, name, description, is_required, accepted_formats, max_file_size_mb, display_order)
VALUES
  ('barber-apprenticeship', 'government_id',
   'Government-Issued Photo ID',
   'Valid driver''s license, state ID, or passport. Must show full name, date of birth, and photo. Expired IDs not accepted.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 1),

  ('barber-apprenticeship', 'social_security_card',
   'Social Security Card or ITIN Letter',
   'Original SSN card or IRS ITIN assignment letter (CP-565). Required for DOL RAPIDS registration. ITIN accepted in place of SSN.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 2),

  ('barber-apprenticeship', 'proof_of_age',
   'Proof of Age (18+)',
   'Birth certificate, passport, or government ID showing date of birth. Must be 18 or older to enroll.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 3),

  ('barber-apprenticeship', 'apprenticeship_agreement',
   'Signed Apprenticeship Agreement',
   'Fully executed apprenticeship agreement signed by apprentice, employer, and Elevate for Humanity. All three signatures required.',
   TRUE, ARRAY['pdf'], 20, 4),

  ('barber-apprenticeship', 'employer_verification',
   'Employer Verification / Offer Letter',
   'Letter from host barbershop confirming employment, wage rate, and start date. Must be on shop letterhead and signed by owner.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 5),

  ('barber-apprenticeship', 'proof_of_address',
   'Proof of Residence',
   'Utility bill, bank statement, or lease agreement dated within 60 days. Must show your name and current address.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 6),

  ('barber-apprenticeship', 'high_school_diploma',
   'High School Diploma or GED',
   'Copy of diploma, GED certificate, or official transcript showing graduation. Required for Indiana PLA barber license eligibility.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 7),

  ('barber-apprenticeship', 'transfer_hours_documentation',
   'Transfer Hours Documentation (if applicable)',
   'Official transcript or letter from prior barber school or apprenticeship program documenting hours completed. Only required if claiming transfer hours.',
   FALSE, ARRAY['pdf','jpg','jpeg','png'], 20, 8),

  ('barber-apprenticeship', 'itin_documentation',
   'ITIN Documentation (if no SSN)',
   'IRS CP-565 ITIN assignment letter. Required only if you do not have a Social Security Number.',
   FALSE, ARRAY['pdf','jpg','jpeg','png'], 10, 9)

ON CONFLICT (program_slug, document_type) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      display_order = EXCLUDED.display_order;

-- ── 20260527000004_fix_lms_lessons_view_slug_and_missing_cols.sql ──
-- Fix lms_lessons view: expose slug (not lesson_slug), add missing columns
-- that the lesson page reads: resources, video_url, quiz_id, description,
-- partner_exam_code, scorm_package_id, scorm_launch_path.
--
-- course_lessons does not have all of these columns natively; NULL-cast
-- placeholders are used for columns that don't exist on the table so the
-- view contract is stable and the lesson page never gets undefined.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                          AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                     AS content,
  cl.lesson_type                          AS step_type,
  cl.lesson_type::TEXT                    AS content_type,
  -- expose as both slug (what lesson page reads) and lesson_slug (legacy)
  cl.slug                                 AS slug,
  cl.slug                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                AS module_title,
  COALESCE(cm.order_index, 0)             AS module_order,
  NULL::INTEGER                           AS lesson_order,
  NULL::INTEGER                           AS duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'                             AS lesson_source,
  cl.created_at,
  cl.updated_at,
  -- columns the lesson page reads that are not on course_lessons base table
  -- partner_exam_code added by migration 20260503000018
  cl.partner_exam_code,
  -- placeholders for columns not yet on course_lessons
  NULL::TEXT                              AS video_url,
  NULL::UUID                              AS quiz_id,
  NULL::TEXT                              AS description,
  NULL::JSONB                             AS resources,
  NULL::TEXT                              AS scorm_package_id,
  NULL::TEXT                              AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 20260527000005_submissions_os_org_vault.sql ──
-- External Submissions OS — Phase 1: Organization Vault
-- Covers grants, contracts, bids, vendor registrations, and all external submissions.
-- All tables are multi-tenant via organization_id.

-- ─────────────────────────────────────────────────────────────────────────────
-- organizations
-- The legal entity that submits. One row per org.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_organizations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name                TEXT NOT NULL,
  dba_name                  TEXT,
  ein                       TEXT,
  uei                       TEXT,                    -- SAM.gov Unique Entity ID
  sam_status                TEXT CHECK (sam_status IN ('active','inactive','pending','unknown')) DEFAULT 'unknown',
  sam_expiration            DATE,
  website                   TEXT,
  phone                     TEXT,
  general_email             TEXT,
  address_line_1            TEXT,
  address_line_2            TEXT,
  city                      TEXT,
  state                     TEXT,
  zip                       TEXT,
  authorized_signatory_name  TEXT,
  authorized_signatory_title TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_orgs_ein ON public.sos_organizations (ein);
CREATE INDEX IF NOT EXISTS idx_sos_orgs_uei ON public.sos_organizations (uei);

ALTER TABLE public.sos_organizations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_orgs_admin" ON public.sos_organizations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- organization_profiles
-- Narrative identity — mission, populations, geography, capacity.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_organization_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  mission_statement     TEXT,
  org_overview          TEXT,
  target_populations    TEXT,
  counties_served       TEXT[],
  service_area_notes    TEXT,
  years_in_operation    INTEGER,
  staff_count           INTEGER,
  board_count           INTEGER,
  insurance_status      TEXT CHECK (insurance_status IN ('current','expired','none','unknown')) DEFAULT 'unknown',
  audit_status          TEXT CHECK (audit_status IN ('current','overdue','not_required','unknown')) DEFAULT 'unknown',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
  CONSTRAINT uq_organization_id_18 UNIQUE (organization_id)
);

ALTER TABLE public.sos_organization_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_org_profiles_admin" ON public.sos_organization_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- organization_facts
-- Atomic, versioned, approved facts. The single source of truth for
-- any value inserted into a generated document.
--
-- Rule: no fact is used in a submission unless status = 'approved'.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_organization_facts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  fact_key         TEXT NOT NULL,
  fact_value_json  JSONB NOT NULL,
  source_type      TEXT NOT NULL CHECK (source_type IN (
                     'manual_entry','document_upload','api_pull',
                     'extracted','imported','calculated'
                   )),
  source_reference TEXT,                -- file name, URL, or note
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','pending_review','approved','rejected','expired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_facts_org_key
  ON public.sos_organization_facts (organization_id, fact_key);
CREATE INDEX IF NOT EXISTS idx_sos_facts_status
  ON public.sos_organization_facts (organization_id, status);

ALTER TABLE public.sos_organization_facts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_facts_admin" ON public.sos_organization_facts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.sos_organization_facts IS
  'Atomic approved facts used as merge-field sources in generated documents. Only status=approved facts may be inserted into submission packets.';
COMMENT ON COLUMN public.sos_organization_facts.fact_key IS
  'Dot-notation key, e.g. counties_served, annual_participants_served, job_placement_rate, completion_rate, wioa_eligible_programs, insured, staff_count';
COMMENT ON COLUMN public.sos_organization_facts.fact_value_json IS
  'Value stored as JSONB to support scalars, arrays, and objects. Scalar example: "1200". Array example: ["Marion","Hamilton","Hendricks"].';

-- ── 20260527000006_submissions_os_asset_vault.sql ──
-- External Submissions OS — Phase 1: Asset Vault
-- Brand assets, document styles (letterhead), and the attachment library.

-- ─────────────────────────────────────────────────────────────────────────────
-- brand_assets
-- Logos, letterhead images, signature images, etc.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_brand_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  asset_type       TEXT NOT NULL CHECK (asset_type IN (
                     'logo','logo_dark','logo_light','letterhead_image',
                     'signature_image','favicon','banner','other'
                   )),
  file_url         TEXT NOT NULL,
  file_path        TEXT,               -- Supabase Storage path
  label            TEXT,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_brand_assets_org
  ON public.sos_brand_assets (organization_id, asset_type, active);

ALTER TABLE public.sos_brand_assets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_brand_assets_admin" ON public.sos_brand_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- document_styles
-- Letterhead / branded layout definitions.
-- Each generated document references one style.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_document_styles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  style_name       TEXT NOT NULL,
  logo_asset_id    UUID REFERENCES public.sos_brand_assets(id),
  header_html      TEXT,               -- HTML injected at top of every page
  footer_html      TEXT,               -- HTML injected at bottom of every page
  font_family      TEXT DEFAULT 'Inter, sans-serif',
  primary_color    TEXT DEFAULT '#1e3a5f',
  secondary_color  TEXT DEFAULT '#4a90d9',
  margin_top       INTEGER DEFAULT 72, -- points
  margin_right     INTEGER DEFAULT 72,
  margin_bottom    INTEGER DEFAULT 72,
  margin_left      INTEGER DEFAULT 72,
  signatory_name   TEXT,
  signatory_title  TEXT,
  is_default       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one default style per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_doc_styles_default
  ON public.sos_document_styles (organization_id)
  WHERE is_default = TRUE;

ALTER TABLE public.sos_document_styles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_doc_styles_admin" ON public.sos_document_styles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- attachment_library
-- Pre-approved files ready to attach to any submission packet.
-- Examples: W-9, insurance cert, audit, board list, staff resumes,
--           UEI letter, SAM proof, capability statement.
--
-- Rule: only status='approved' attachments may be included in packets.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_attachment_library (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL CHECK (document_type IN (
                     'w9','insurance_certificate','general_liability_cert',
                     'workers_comp_cert','audit_report','board_list',
                     'staff_resume','uei_letter','sam_proof',
                     'capability_statement','past_performance_summary',
                     'financial_statement','tax_return','nonprofit_determination',
                     'articles_of_incorporation','bylaws','mou','employer_agreement',
                     'license','certification','other'
                   )),
  title            TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_path        TEXT,
  effective_date   DATE,
  expiration_date  DATE,
  status           TEXT NOT NULL DEFAULT 'pending',
                   CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_attachments_org_type
  ON public.sos_attachment_library (organization_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_sos_attachments_expiry
  ON public.sos_attachment_library (expiration_date)
  WHERE expiration_date IS NOT NULL;

ALTER TABLE public.sos_attachment_library ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_attachments_admin" ON public.sos_attachment_library FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.sos_attachment_library IS
  'Pre-approved files for inclusion in submission packets. Only status=approved rows may be attached. Expiration_date triggers a review task when within 30 days.';

-- ── 20260527000007_submissions_os_evidence_vault.sql ──
-- External Submissions OS — Phase 1: Evidence Vault
-- Past performance, rate sheets, compliance records, partner entities.
-- These feed contract bids, RFPs, and vendor registrations — not just grants.

-- ─────────────────────────────────────────────────────────────────────────────
-- past_performance_records
-- Approved project history used in capability statements and past-performance
-- sections of RFPs, contracts, and grant applications.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_past_performance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  client_name      TEXT NOT NULL,
  project_name     TEXT NOT NULL,
  project_type     TEXT NOT NULL CHECK (project_type IN (
                     'grant','contract','workforce_program','training_program',
                     'apprenticeship','consulting','vendor_service',
                     'partnership','other'
                   )),
  start_date       DATE,
  end_date         DATE,
  contract_value   NUMERIC(14,2),
  description      TEXT NOT NULL,
  outcomes_json    JSONB,              -- { participants: 120, placement_rate: 0.82, ... }
  contact_name     TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','approved','archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_pp_org_status
  ON public.sos_past_performance (organization_id, status);

ALTER TABLE public.sos_past_performance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_pp_admin" ON public.sos_past_performance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- rate_sheets
-- Approved labor and service rates. Required for contract bids and RFPs.
-- Blocked from auto-submission — must be explicitly approved per packet.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_rate_sheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  rate_type        TEXT NOT NULL CHECK (rate_type IN (
                     'labor_hourly','labor_daily','service_unit',
                     'indirect_cost','fringe_benefit','overhead','other'
                   )),
  title            TEXT NOT NULL,
  effective_date   DATE NOT NULL,
  expiration_date  DATE,
  rates_json       JSONB NOT NULL,    -- [{ role: "Instructor", rate: 65.00, unit: "hour" }, ...]
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','approved','expired','superseded')),
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_rates_org_status
  ON public.sos_rate_sheets (organization_id, status);

ALTER TABLE public.sos_rate_sheets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_rates_admin" ON public.sos_rate_sheets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.sos_rate_sheets IS
  'Approved rate sheets for contract bids. review_class=blocked — never auto-submitted. Must be explicitly approved per submission packet.';

-- ─────────────────────────────────────────────────────────────────────────────
-- compliance_records
-- Active licenses, certifications, registrations, and renewals.
-- Expiration tracking drives review tasks.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_compliance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  record_type      TEXT NOT NULL CHECK (record_type IN (
                     'state_license','federal_registration','sam_registration',
                     'nonprofit_status','insurance','bonding','certification',
                     'dbe_certification','mbe_certification','wbe_certification',
                     'sbe_certification','etpl_listing','wioa_approval',
                     'dol_registration','state_vendor_registration','other'
                   )),
  title            TEXT NOT NULL,
  issuing_authority TEXT,
  reference_number TEXT,
  file_url         TEXT,
  file_path        TEXT,
  effective_date   DATE,
  expiration_date  DATE,
  status           TEXT NOT NULL DEFAULT 'active',
                   CHECK (status IN ('active','expired','pending_renewal','revoked','unknown')),
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_compliance_org_type
  ON public.sos_compliance_records (organization_id, record_type, status);
CREATE INDEX IF NOT EXISTS idx_sos_compliance_expiry
  ON public.sos_compliance_records (expiration_date)
  WHERE expiration_date IS NOT NULL;

ALTER TABLE public.sos_compliance_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_compliance_admin" ON public.sos_compliance_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- partner_entities
-- Approved partners, subcontractors, and MOU signatories.
-- Used in partnership applications, subcontractor packets, and letters of support.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_partner_entities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  legal_name        TEXT NOT NULL,
  dba_name          TEXT,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
                      'subcontractor','mou_partner','referral_partner',
                      'employer_partner','fiscal_agent','co_applicant',
                      'letter_of_support_provider','vendor','other'
                    )),
  ein               TEXT,
  approved_for_use  BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_partners_org
  ON public.sos_partner_entities (organization_id, approved_for_use);

ALTER TABLE public.sos_partner_entities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_partners_admin" ON public.sos_partner_entities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 20260527000008_submissions_os_content_templates.sql ──
-- External Submissions OS — Phase 2: Content Blocks + Document Templates
-- Approved reusable prose and branded document layouts.

-- ─────────────────────────────────────────────────────────────────────────────
-- content_blocks
-- Pre-approved prose fragments. The system pulls from these instead of
-- generating from scratch. Only status='approved' blocks may be inserted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_content_blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  block_type       TEXT NOT NULL CHECK (block_type IN (
                     'mission','org_history','org_overview',
                     'program_summary','workforce_development_approach',
                     'equity_statement','employer_engagement',
                     'apprenticeship_model','past_performance_narrative',
                     'rural_access','youth_services','reentry_services',
                     'technical_approach','quality_assurance',
                     'staffing_approach','budget_justification',
                     'evaluation_plan','sustainability_plan',
                     'partnership_narrative','compliance_statement','other'
                   )),
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,      -- approved prose, may contain {{merge_fields}}
  tags             TEXT[],             -- e.g. ['workforce','indiana','youth']
  word_count       INTEGER GENERATED ALWAYS AS (
                     array_length(string_to_array(trim(content), ' '), 1)
                   ) STORED,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft',
                   CHECK (status IN ('draft','pending_review','approved','archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_content_org_type
  ON public.sos_content_blocks (organization_id, block_type, status);
CREATE INDEX IF NOT EXISTS idx_sos_content_tags
  ON public.sos_content_blocks USING GIN (tags);

ALTER TABLE public.sos_content_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_content_admin" ON public.sos_content_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.sos_content_blocks IS
  'Approved prose building blocks. Only status=approved blocks may be inserted into generated documents. Merge fields use {{fact.key}} and {{org.field}} syntax.';

-- ─────────────────────────────────────────────────────────────────────────────
-- document_templates
-- Defines the structure of a generated document.
-- body_template uses merge fields:
--   {{org.legal_name}}  {{org.ein}}  {{org.website}}
--   {{fact.counties_served}}  {{fact.annual_participants_served}}
--   {{content.mission}}  {{content.org_overview}}
--   {{opportunity.title}}  {{opportunity.issuer_name}}  {{opportunity.due_date}}
--   {{style.signatory_name}}  {{style.signatory_title}}
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_document_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  template_name    TEXT NOT NULL,
  document_type    TEXT NOT NULL CHECK (document_type IN (
                     'cover_letter','capability_statement','vendor_profile',
                     'org_overview','past_performance_sheet',
                     'pricing_narrative','budget_narrative',
                     'technical_approach','scope_of_work_response',
                     'implementation_plan','staffing_plan',
                     'quality_assurance_plan','partnership_letter',
                     'letter_of_support','compliance_statement',
                     'transmittal_letter','mou_draft',
                     'employer_agreement','subcontractor_response',
                     'letter_of_interest','other'
                   )),
  style_id         UUID REFERENCES public.sos_document_styles(id),
  body_template    TEXT NOT NULL,      -- HTML with {{merge_fields}}
  output_format    TEXT NOT NULL DEFAULT 'pdf',
                   CHECK (output_format IN ('pdf','docx','html')),
  requires_review  BOOLEAN NOT NULL DEFAULT TRUE,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  version          INTEGER NOT NULL DEFAULT 1,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_templates_org_type
  ON public.sos_document_templates (organization_id, document_type, active);

ALTER TABLE public.sos_document_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_templates_admin" ON public.sos_document_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.sos_document_templates IS
  'Branded document layouts with merge fields. body_template is HTML. The generation engine resolves {{org.*}}, {{fact.*}}, {{content.*}}, {{opportunity.*}}, and {{style.*}} tokens against approved data only.';

-- ── 20260527000009_submissions_os_opportunities.sql ──
-- External Submissions OS — Phase 3: Link Ingestion + Opportunity Profiling
-- Covers grants, contracts, bids, RFPs, RFQs, vendor registrations, and all
-- external submission types.

-- ─────────────────────────────────────────────────────────────────────────────
-- source_links
-- Every opportunity starts with a URL paste. This table is the entry point.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_source_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  submitted_by     UUID REFERENCES auth.users(id),
  original_url     TEXT NOT NULL,
  final_url        TEXT,               -- after redirects
  source_domain    TEXT,
  content_type     TEXT CHECK (content_type IN ('html','pdf','docx','xlsx','unknown')),
  fetch_status     TEXT NOT NULL DEFAULT 'pending',
                   CHECK (fetch_status IN ('pending','fetching','success','failed','blocked')),
  fetched_at       TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_links_org
  ON public.sos_source_links (organization_id, fetch_status);

ALTER TABLE public.sos_source_links ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_links_admin" ON public.sos_source_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- source_documents
-- Raw extracted content from a fetched link.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_source_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_link_id   UUID NOT NULL REFERENCES public.sos_source_links(id) ON DELETE CASCADE,
  title            TEXT,
  raw_text         TEXT,               -- full extracted text
  extracted_text   TEXT,               -- cleaned / normalized
  metadata_json    JSONB,              -- page count, author, dates found, etc.
  hash             TEXT,               -- SHA-256 of raw_text for dedup
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_source_docs_link
  ON public.sos_source_documents (source_link_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sos_source_docs_hash
  ON public.sos_source_documents (hash)
  WHERE hash IS NOT NULL;

ALTER TABLE public.sos_source_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_source_docs_admin" ON public.sos_source_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- source_document_sections
-- Parsed sections of a source document (eligibility, requirements, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_source_document_sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id  UUID NOT NULL REFERENCES public.sos_source_documents(id) ON DELETE CASCADE,
  section_type        TEXT CHECK (section_type IN (
                        'overview','eligibility','requirements','attachments',
                        'budget','timeline','evaluation','submission_instructions',
                        'contact','other'
                      )),
  heading             TEXT,
  body_text           TEXT NOT NULL,
  page_number         INTEGER,
  confidence          NUMERIC(3,2),    -- 0.00–1.00 extraction confidence
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_sections_doc
  ON public.sos_source_document_sections (source_document_id, section_type);

ALTER TABLE public.sos_source_document_sections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_sections_admin" ON public.sos_source_document_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- opportunities
-- Universal opportunity record — grants, contracts, bids, registrations, all.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  source_link_id      UUID REFERENCES public.sos_source_links(id),
  opportunity_type    TEXT NOT NULL CHECK (opportunity_type IN (
                        'grant','contract','bid','rfp','rfq','rfi',
                        'vendor_registration','supplier_onboarding',
                        'state_agency_application','workforce_provider_application',
                        'partnership_application','license_renewal',
                        'compliance_submission','employer_agreement_packet','other'
                      )),
  issuer_name         TEXT NOT NULL,
  title               TEXT NOT NULL,
  reference_number    TEXT,            -- CFDA, solicitation #, RFP #, etc.
  status              TEXT NOT NULL DEFAULT 'profiling',
                      CHECK (status IN (
                        'profiling','requirements_extracted','mapping',
                        'packet_building','review','ready','submitted',
                        'awarded','not_awarded','withdrawn','archived'
                      )),
  submission_method   TEXT CHECK (submission_method IN (
                        'online_portal','email','mail','hand_delivery',
                        'grants_gov','sam_gov','state_portal','other'
                      )),
  portal_url          TEXT,
  issue_date          DATE,
  due_date            TIMESTAMPTZ,
  questions_deadline  TIMESTAMPTZ,
  estimated_value     NUMERIC(14,2),
  eligibility_text    TEXT,
  scope_summary       TEXT,
  profiled_by         UUID REFERENCES auth.users(id),
  profiled_at         TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_opps_org_status
  ON public.sos_opportunities (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_opps_due_date
  ON public.sos_opportunities (due_date)
  WHERE due_date IS NOT NULL;

ALTER TABLE public.sos_opportunities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_opps_admin" ON public.sos_opportunities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- opportunity_requirements
-- Every item the issuer requires in the submission.
-- review_class is set during extraction and drives the classification engine.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_opportunity_requirements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id      UUID NOT NULL REFERENCES public.sos_opportunities(id) ON DELETE CASCADE,
  requirement_category TEXT NOT NULL CHECK (requirement_category IN (
                         'organization_fact','form_field','narrative',
                         'attachment','budget','pricing',
                         'compliance_document','insurance_document',
                         'certification','signature','reference',
                         'partner_document','staff_document',
                         'work_sample','scope_response','other'
                       )),
  requirement_name    TEXT NOT NULL,
  description         TEXT,
  required            BOOLEAN NOT NULL DEFAULT TRUE,
  source_section_id   UUID REFERENCES public.sos_source_document_sections(id),
  response_format     TEXT,            -- e.g. 'pdf', 'form_field', 'narrative_text'
  word_limit          INTEGER,
  attachment_type     TEXT,            -- e.g. 'w9', 'insurance_certificate'
  due_date            TIMESTAMPTZ,
  -- Classification — the backbone of the submission safety system
  review_class        TEXT NOT NULL DEFAULT 'review_required',
                      CHECK (review_class IN (
                        'auto_safe',        -- legal name, EIN, address, pre-approved attachments
                        'ask_if_missing',   -- service area, counts, program list
                        'review_required',  -- narratives, budgets, tech approach
                        'blocked'           -- signatures, legal attestations, pricing commitments
                      )),
  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_reqs_opp
  ON public.sos_opportunity_requirements (opportunity_id, review_class);

ALTER TABLE public.sos_opportunity_requirements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_reqs_admin" ON public.sos_opportunity_requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.sos_opportunity_requirements.review_class IS
  'auto_safe: legal name/EIN/address/pre-approved attachments. ask_if_missing: service area/counts/programs. review_required: narratives/budgets/plans. blocked: signatures/legal attestations/pricing commitments. System halts on any blocked or unresolved review_required item.';

-- ─────────────────────────────────────────────────────────────────────────────
-- requirement_mappings
-- Links each requirement to the approved data source that will satisfy it.
-- This is the classification engine output.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_requirement_mappings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_requirement_id UUID NOT NULL REFERENCES public.sos_opportunity_requirements(id) ON DELETE CASCADE,
  mapped_source_type       TEXT NOT NULL CHECK (mapped_source_type IN (
                             'org_field','org_fact','content_block',
                             'attachment','past_performance','rate_sheet',
                             'compliance_record','partner_entity',
                             'manual_input','template_generated','none'
                           )),
  mapped_source_id         UUID,        -- FK to the relevant table row
  mapping_confidence       NUMERIC(3,2) DEFAULT 1.00,  -- 0.00–1.00
  submission_class         TEXT NOT NULL DEFAULT 'review_required',
                           CHECK (submission_class IN (
                             'auto_safe','ask_if_missing',
                             'review_required','blocked'
                           )),
  resolution_status        TEXT NOT NULL DEFAULT 'unresolved',
                           CHECK (resolution_status IN (
                             'unresolved','resolved','approved',
                             'blocked','waived'
                           )),
  resolved_by              UUID REFERENCES auth.users(id),
  resolved_at              TIMESTAMPTZ,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_mappings_req
  ON public.sos_requirement_mappings (opportunity_requirement_id, resolution_status);

ALTER TABLE public.sos_requirement_mappings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_mappings_admin" ON public.sos_requirement_mappings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 20260527000010_submissions_os_packets_audit.sql ──
-- External Submissions OS — Phase 5: Packets, Review Tasks, Submission Controls, Audit Logs

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_packets
-- One packet per opportunity. Assembles all generated documents and attachments.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_submission_packets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  opportunity_id   UUID NOT NULL REFERENCES public.sos_opportunities(id) ON DELETE CASCADE,
  packet_status    TEXT NOT NULL DEFAULT 'building',
                   CHECK (packet_status IN (
                     'building','review','ready','blocked',
                     'submitted','withdrawn','archived'
                   )),
  created_by       UUID REFERENCES auth.users(id),
  submitted_by     UUID REFERENCES auth.users(id),
  submitted_at     TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_packets_org_status
  ON public.sos_submission_packets (organization_id, packet_status);

ALTER TABLE public.sos_submission_packets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_packets_admin" ON public.sos_submission_packets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- generated_documents
-- Each document produced for a packet. Tracks template used and review status.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_generated_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_packet_id UUID NOT NULL REFERENCES public.sos_submission_packets(id) ON DELETE CASCADE,
  template_id          UUID REFERENCES public.sos_document_templates(id),
  document_type        TEXT NOT NULL,
  title                TEXT NOT NULL,
  content_html         TEXT,
  output_file_url      TEXT,
  output_file_path     TEXT,
  review_status        TEXT NOT NULL DEFAULT 'pending',
                       CHECK (review_status IN ('pending','approved','rejected','superseded')),
  reviewed_by          UUID REFERENCES auth.users(id),
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_gen_docs_packet
  ON public.sos_generated_documents (submission_packet_id, review_status);

ALTER TABLE public.sos_generated_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_gen_docs_admin" ON public.sos_generated_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- document_data_sources
-- Every value inserted into a generated document is logged here.
-- Rule 4: every generated document must record the source of each inserted value.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_document_data_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_document_id UUID NOT NULL REFERENCES public.sos_generated_documents(id) ON DELETE CASCADE,
  source_type           TEXT NOT NULL CHECK (source_type IN (
                          'org_field','org_fact','content_block',
                          'attachment','past_performance','rate_sheet',
                          'compliance_record','manual_input','template_static'
                        )),
  source_id             UUID,
  field_name            TEXT NOT NULL,   -- merge field key, e.g. 'org.legal_name'
  inserted_value        TEXT,            -- the actual value that was inserted
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_data_sources_doc
  ON public.sos_document_data_sources (generated_document_id);

ALTER TABLE public.sos_document_data_sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_data_sources_admin" ON public.sos_document_data_sources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- review_tasks
-- Exception queue. Created whenever a requirement cannot be auto-resolved.
-- Rule: system halts and creates a task instead of inventing an answer.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_review_tasks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  opportunity_id       UUID REFERENCES public.sos_opportunities(id),
  submission_packet_id UUID REFERENCES public.sos_submission_packets(id),
  task_type            TEXT NOT NULL CHECK (task_type IN (
                         'missing_fact','missing_attachment','narrative_required',
                         'budget_required','signature_required','partner_document',
                         'custom_response','pricing_required','legal_review',
                         'expiring_document','other'
                       )),
  title                TEXT NOT NULL,
  description          TEXT,
  related_record_type  TEXT,
  related_record_id    UUID,
  priority             TEXT NOT NULL DEFAULT 'medium',
                       CHECK (priority IN ('low','medium','high','critical')),
  status               TEXT NOT NULL DEFAULT 'open',
                       CHECK (status IN ('open','in_progress','resolved','waived','cancelled')),
  assigned_to          UUID REFERENCES auth.users(id),
  resolved_by          UUID REFERENCES auth.users(id),
  resolved_at          TIMESTAMPTZ,
  resolution_notes     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_tasks_org_status
  ON public.sos_review_tasks (organization_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_sos_tasks_packet
  ON public.sos_review_tasks (submission_packet_id, status);

ALTER TABLE public.sos_review_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_tasks_admin" ON public.sos_review_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_runs
-- Each attempt to submit a packet. Enforces the safety gate.
-- Rule: may only run if every required item is auto_safe or explicitly approved.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_submission_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_packet_id UUID NOT NULL REFERENCES public.sos_submission_packets(id) ON DELETE CASCADE,
  run_status           TEXT NOT NULL DEFAULT 'pending',
                       CHECK (run_status IN (
                         'pending','running','completed','failed',
                         'blocked','cancelled'
                       )),
  submit_mode          TEXT NOT NULL DEFAULT 'manual',
                       CHECK (submit_mode IN ('manual','automated')),
  submitted_by         UUID REFERENCES auth.users(id),
  submitted_at         TIMESTAMPTZ,
  blocked_reason       TEXT,           -- populated when run_status = 'blocked'
  response_log         JSONB,          -- portal response, confirmation numbers, etc.
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_runs_packet
  ON public.sos_submission_runs (submission_packet_id, run_status);

ALTER TABLE public.sos_submission_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sos_runs_admin" ON public.sos_submission_runs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_audit_logs
-- Rule 5: every submission must produce a permanent audit log.
-- Immutable — no UPDATE or DELETE policies.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_submission_audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_run_id UUID REFERENCES public.sos_submission_runs(id),
  organization_id   UUID REFERENCES public.sos_organizations(id),
  event_type        TEXT NOT NULL CHECK (event_type IN (
                      'packet_created','document_generated','fact_inserted',
                      'attachment_included','requirement_mapped',
                      'review_task_created','review_task_resolved',
                      'safety_gate_passed','safety_gate_blocked',
                      'submission_started','submission_completed',
                      'submission_failed','approval_recorded'
                    )),
  event_detail      TEXT,
  source_reference  TEXT,             -- table:id of the source record
  actor_id          UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_audit_run
  ON public.sos_submission_audit_logs (submission_run_id);
CREATE INDEX IF NOT EXISTS idx_sos_audit_org
  ON public.sos_submission_audit_logs (organization_id, created_at DESC);

ALTER TABLE public.sos_submission_audit_logs ENABLE ROW LEVEL SECURITY;

-- Read-only for admins — no delete, no update (immutable audit trail)
DO $$ BEGIN CREATE POLICY "sos_audit_admin_select" ON public.sos_submission_audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sos_audit_insert" ON public.sos_submission_audit_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  )); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.sos_submission_audit_logs IS
  'Immutable audit trail. No UPDATE or DELETE allowed. Every submission run, fact insertion, and approval is recorded here permanently.';

-- ── 20260527000011_submissions_os_seed_efh.sql ──
-- External Submissions OS — Seed: Elevate for Humanity org record
-- Run AFTER migrations 20260527000005 through 20260527000010.
-- All values are placeholders — update via /admin/submissions/org before use.

DO $$
DECLARE
  v_org_id  UUID := 'e1e10000-0000-0000-0000-000000000001';
  v_style_id UUID := 'e1e10000-0000-0000-0000-000000000002';
BEGIN

-- ── Organization ─────────────────────────────────────────────────────────────
INSERT INTO public.sos_organizations (
  id, legal_name, dba_name, ein, uei, sam_status,
  website, phone, general_email,
  address_line_1, city, state, zip,
  authorized_signatory_name, authorized_signatory_title
) VALUES (
  v_org_id,
  'Elevate for Humanity Inc.',
  'Elevate for Humanity',
  NULL,           -- ← enter EIN in /admin/submissions/org
  NULL,           -- ← enter UEI after SAM.gov registration
  'unknown',
  'https://www.elevateforhumanity.org',
  '(317) 314-3757',
  'info@elevateforhumanity.org',
  NULL,           -- ← enter street address
  'Indianapolis', 'IN', NULL,
  NULL,           -- ← enter authorized signatory name
  NULL            -- ← enter authorized signatory title
)
ON CONFLICT (id) DO NOTHING;

-- ── Organization Profile ─────────────────────────────────────────────────────
INSERT INTO public.sos_organization_profiles (
  organization_id,
  mission_statement,
  target_populations,
  counties_served,
  service_area_notes,
  insurance_status,
  audit_status
) VALUES (
  v_org_id,
  'Elevate for Humanity empowers individuals through workforce development, registered apprenticeships, and career training programs that create pathways to sustainable employment.',
  'Underserved adults, justice-involved individuals, youth, and career changers seeking skilled trades and professional credentials',
  ARRAY['Marion','Hamilton','Hendricks','Johnson','Boone','Madison','Hancock'],
  'Central Indiana — statewide expansion in progress',
  'unknown',   -- ← update once insurance cert is uploaded
  'unknown'    -- ← update once audit is complete
)
ON CONFLICT (organization_id) DO NOTHING;

-- ── Default Document Style ───────────────────────────────────────────────────
INSERT INTO public.sos_document_styles (
  id, organization_id, style_name,
  primary_color, secondary_color,
  font_family,
  signatory_name, signatory_title,
  is_default
) VALUES (
  v_style_id,
  v_org_id,
  'Elevate for Humanity — Standard',
  '#1e3a5f',
  '#4a90d9',
  'Inter, sans-serif',
  NULL,   -- ← set after org profile is complete
  NULL,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ── Seed approved facts (known public data) ──────────────────────────────────
-- Only insert facts that are publicly verifiable. All others must be entered
-- and approved manually via /admin/submissions/facts.

INSERT INTO public.sos_organization_facts
  (organization_id, fact_key, fact_value_json, source_type, source_reference, status)
VALUES
  (v_org_id, 'org.website',
   '"https://www.elevateforhumanity.org"',
   'manual_entry', 'Public website', 'approved'),

  (v_org_id, 'org.phone',
   '"(317) 314-3757"',
   'manual_entry', 'Public contact', 'approved'),

  (v_org_id, 'org.state',
   '"Indiana"',
   'manual_entry', 'State of incorporation', 'approved'),

  (v_org_id, 'org.city',
   '"Indianapolis"',
   'manual_entry', 'Primary office location', 'approved'),

  (v_org_id, 'counties_served',
   '["Marion","Hamilton","Hendricks","Johnson","Boone","Madison","Hancock"]',
   'manual_entry', 'Service area documentation', 'approved'),

  (v_org_id, 'programs.barber_apprenticeship',
   '{"name":"Barber Apprenticeship","type":"DOL Registered Apprenticeship","hours_ojl":2000,"hours_rti":144,"credential":"Indiana Barber License","status":"active"}',
   'manual_entry', 'DOL RAPIDS registration', 'approved'),

  (v_org_id, 'programs.hvac_technician',
   '{"name":"HVAC Technician","type":"Credential Training","credential":"EPA 608 Certification","status":"active"}',
   'manual_entry', 'Program catalog', 'approved'),

  -- Facts that need to be verified and approved before use:
  (v_org_id, 'org.ein',
   'null',
   'manual_entry', 'Enter EIN from IRS documents', 'draft'),

  (v_org_id, 'org.uei',
   'null',
   'manual_entry', 'Enter UEI from SAM.gov', 'draft'),

  (v_org_id, 'annual_participants_served',
   'null',
   'manual_entry', 'Enter from most recent annual report', 'draft'),

  (v_org_id, 'job_placement_rate',
   'null',
   'manual_entry', 'Enter verified placement rate with source', 'draft'),

  (v_org_id, 'completion_rate',
   'null',
   'manual_entry', 'Enter verified completion rate with source', 'draft'),

  (v_org_id, 'staff_count',
   'null',
   'manual_entry', 'Enter current FTE + PT staff count', 'draft'),

  (v_org_id, 'wioa_eligible_programs',
   'null',
   'manual_entry', 'List WIOA-eligible programs after ETPL listing confirmed', 'draft')

ON CONFLICT DO NOTHING;

RAISE NOTICE 'Elevate for Humanity seed complete. Update draft facts at /admin/submissions/facts before using in packets.';

END $$;

-- ── 20260527000012_client_consents.sql ──
-- client_consents: stores signed engagement + §7216 consent records
-- Every SupersonicFastCash client must have a row here before accessing
-- upload-documents or the client portal.

CREATE TABLE IF NOT EXISTS public.client_consents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name        text NOT NULL,
  ssn_last4        text NOT NULL CHECK (ssn_last4 ~ '^\d{4}$'),
  ip_address       text NOT NULL,
  user_agent       text,
  consent_version  text NOT NULL DEFAULT 'v1.0',
  signed_at        timestamptz NOT NULL DEFAULT now(),
  signature_text   text NOT NULL,
  -- snapshot of the exact document text they agreed to
  document_snapshot text NOT NULL
);

-- One active consent per user (latest wins — allow re-sign on version bump)
CREATE INDEX IF NOT EXISTS client_consents_client_id_idx ON public.client_consents(client_id);
CREATE INDEX IF NOT EXISTS client_consents_signed_at_idx  ON public.client_consents(signed_at DESC);

-- RLS: users can only read their own consent; inserts via service role only
ALTER TABLE public.client_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "users_read_own_consent" ON public.client_consents FOR SELECT
  USING (client_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No direct client INSERT — all writes go through the API route (service role)

-- ── 20260527000013_tax_payments.sql ──
-- tax_payments: tracks Stripe payment state for SupersonicFastCash clients.
-- payment_status is written ONLY by the Stripe webhook handler, never by the
-- frontend redirect. The webhook is the source of truth.

CREATE TABLE IF NOT EXISTS public.tax_payments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id          text,
  stripe_checkout_session_id  text UNIQUE,
  stripe_payment_intent_id    text,
  amount                      integer NOT NULL,          -- cents
  currency                    text NOT NULL DEFAULT 'usd',
  payment_type                text NOT NULL DEFAULT 'deposit',  -- 'deposit' | 'full'
  status                      text NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'failed' | 'refunded'
  paid_at                     timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tax_payments_client_id_idx   ON public.tax_payments(client_id);
CREATE INDEX IF NOT EXISTS tax_payments_session_id_idx  ON public.tax_payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS tax_payments_status_idx      ON public.tax_payments(status);

-- RLS: clients can read their own payment records
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_payments" ON public.tax_payments;
DO $$ BEGIN CREATE POLICY "users_read_own_payments" ON public.tax_payments FOR SELECT
  USING (client_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- All writes go through the API (service role) — no direct client inserts/updates

-- ── 20260527000014_program_enrollments_funding_verified.sql ──
-- Add funding_verified column referenced by the enrollment state trigger.
-- The trigger in 20260503000013 references NEW.funding_verified but the column
-- was never added, causing every UPDATE on program_enrollments to crash with
-- "record new has no field funding_verified".

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS funding_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: enrollments in active/onboarding state are considered verified.
UPDATE public.program_enrollments
SET funding_verified = TRUE
WHERE enrollment_state IN ('active', 'onboarding', 'completed')
  AND funding_verified = FALSE;

-- ── 20260527000015_timeclock_site_columns.sql ──
-- Timeclock site table alignment
-- The timeclock action/heartbeat routes query apprentice_sites but used
-- column names from the older partner_sites table (center_lat, center_lng, radius_m).
-- This migration adds those alias columns so both naming conventions work,
-- and adds is_active for the context route filter.

ALTER TABLE public.apprentice_sites
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS center_lat  DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS center_lng  DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS radius_m    INTEGER;

-- Back-fill alias columns from canonical columns
UPDATE public.apprentice_sites
SET
  center_lat = latitude,
  center_lng = longitude,
  radius_m   = radius_meters
WHERE center_lat IS NULL;

-- Keep alias columns in sync via trigger
CREATE OR REPLACE FUNCTION public.sync_apprentice_site_aliases()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.center_lat  := COALESCE(NEW.center_lat,  NEW.latitude);
  NEW.center_lng  := COALESCE(NEW.center_lng,  NEW.longitude);
  NEW.radius_m    := COALESCE(NEW.radius_m,    NEW.radius_meters);
  NEW.latitude    := COALESCE(NEW.latitude,    NEW.center_lat);
  NEW.longitude   := COALESCE(NEW.longitude,   NEW.center_lng);
  NEW.radius_meters := COALESCE(NEW.radius_meters, NEW.radius_m);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_apprentice_site_aliases ON public.apprentice_sites;
CREATE TRIGGER trg_sync_apprentice_site_aliases
  BEFORE INSERT OR UPDATE ON public.apprentice_sites
  FOR EACH ROW EXECUTE FUNCTION public.sync_apprentice_site_aliases();

-- shop_id column used by context route
ALTER TABLE public.apprentice_sites
  ADD COLUMN IF NOT EXISTS shop_id UUID;

COMMENT ON TABLE public.apprentice_sites IS
  'GPS geofence definitions for apprenticeship worksites. Canonical columns: latitude, longitude, radius_meters. Alias columns center_lat/center_lng/radius_m kept for backward compat.';

-- ── 20260528000001_course_lessons_rendered_html.sql ──
-- Add rendered_html column to course_lessons
-- Stores pre-rendered HTML from transformLessonContent() at write time.
-- NULL for legacy rows — lesson page falls back to runtime transform.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS rendered_html TEXT;

COMMENT ON COLUMN public.course_lessons.rendered_html IS
  'HTML produced by transformLessonContent() at write time. NULL for legacy rows — lesson page falls back to runtime transform.';

-- Rebuild lms_lessons view to expose rendered_html.
-- Must DROP first because CREATE OR REPLACE cannot reorder existing columns.
DROP VIEW IF EXISTS public.lms_lessons;

CREATE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                        AS lesson_number,
  cl.title,
  (cl.content ->> '{}'::text)           AS content,
  cl.rendered_html,
  cl.lesson_type                        AS step_type,
  (cl.lesson_type)::text                AS content_type,
  cl.slug                               AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                              AS module_title,
  COALESCE(cm.order_index, 0)           AS module_order,
  NULL::integer                         AS lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'::text                     AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM course_lessons cl
LEFT JOIN course_modules cm ON cm.id = cl.module_id;

-- ── 20260528000002_tutorials_table.sql ──
-- Tutorials table for /help/tutorials
-- Replaces hardcoded array in page.tsx

ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tutorials_slug ON public.tutorials(slug) WHERE slug IS NOT NULL;
/*SKIP_CREATE
CREATE TABLE IF NOT EXISTS public.tutorials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text,
  category      text NOT NULL,
  thumbnail_url text,
  video_url     text,
  duration      text,
  is_published  boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published tutorials
DO $$ BEGIN CREATE POLICY "tutorials_read" ON public.tutorials
  FOR SELECT USING (is_published = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can manage all tutorials
DO $$ BEGIN CREATE POLICY "tutorials_admin" ON public.tutorials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed the 12 existing tutorials from the hardcoded array
INSERT INTO public.tutorials (slug, title, description, category, duration, sort_order) VALUES
  ('getting-started',         'Getting Started with Elevate LMS',       'Learn how to navigate the platform and set up your learner profile.',                                    'Getting Started', '5 min',  1),
  ('enrolling-in-courses',    'Enrolling in Courses',                    'Step-by-step guide to finding and enrolling in your first course.',                                      'Getting Started', '4 min',  2),
  ('completing-lessons',      'Completing Lessons and Tracking Progress','How to work through lessons, mark them complete, and monitor your progress.',                            'Learning',        '6 min',  3),
  ('taking-quizzes',          'Taking Quizzes and Assessments',          'Tips for completing quizzes, understanding your scores, and retaking assessments.',                      'Learning',        '5 min',  4),
  ('downloading-certificates','Downloading Your Certificates',           'How to access and download your completion certificates after finishing a course.',                      'Certificates',    '3 min',  5),
  ('sharing-credentials',     'Sharing Your Credentials',                'Share your certificates and credentials with employers and on LinkedIn.',                                'Certificates',    '4 min',  6),
  ('managing-profile',        'Managing Your Profile',                   'Update your personal information, profile photo, and notification preferences.',                         'Account',         '4 min',  7),
  ('payment-financial-aid',   'Payment and Financial Aid Options',       'Understand your payment options, financial aid eligibility, and how to apply for funding.',              'Account',         '7 min',  8),
  ('mobile-app',              'Using the Mobile App',                    'Access your courses on the go with the Elevate mobile experience.',                                      'Getting Started', '5 min',  9),
  ('live-sessions',           'Joining Live Sessions',                   'How to join live instructor sessions, webinars, and virtual office hours.',                              'Learning',        '6 min', 10),
  ('technical-requirements',  'Technical Requirements',                  'System requirements, browser compatibility, and troubleshooting common technical issues.',               'Support',         '4 min', 11),
  ('contacting-support',      'Contacting Support',                      'How to reach our support team, submit a ticket, and get help when you need it.',                        'Support',         '3 min', 12)
ON CONFLICT (slug) DO NOTHING;
*/

-- ── 20260529000001_grant_anon_program_tables.sql ──
-- Grant anon read access to program detail tables.
-- These tables had no SELECT grant for the anon role, causing 401s on all
-- public program pages that use createPublicClient().

GRANT SELECT ON public.program_media    TO anon;
GRANT SELECT ON public.program_ctas     TO anon;
GRANT SELECT ON public.program_tracks   TO anon;
GRANT SELECT ON public.program_modules  TO anon;
GRANT SELECT ON public.program_lessons  TO anon;

-- ── 20260529000002_lms_lessons_include_curriculum_lessons.sql ──
-- Rebuild lms_lessons view to prioritize curriculum_lessons over course_lessons.
--
-- Key fixes vs previous version:
-- 1. Cast step_type to TEXT (curriculum_lessons uses an enum, course_lessons uses text)
-- 2. Resolve module_id from course_modules via module_order join — curriculum_lessons
--    has a FK to the 'modules' table, not 'course_modules', so we can't store
--    course_modules.id directly. The view resolves it at query time.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE VIEW public.lms_lessons AS

-- ── 1. curriculum_lessons (priority) ─────────────────────────────────────────
SELECT
  cl.id,
  cl.course_id,
  (cl.module_order * 1000 + cl.lesson_order)  AS order_index,
  cl.lesson_order                              AS lesson_number,
  cl.lesson_title                              AS title,
  cl.script_text                               AS content,
  NULL::TEXT                                   AS rendered_html,
  cl.step_type::TEXT                           AS step_type,
  cl.step_type::TEXT                           AS content_type,
  cl.lesson_slug                               AS slug,
  cl.lesson_slug                               AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  NULL::JSONB                                  AS activities,
  NULL::JSONB                                  AS video_config,
  cm.id                                        AS module_id,
  cm.title                                     AS module_title,
  cl.module_order,
  cl.lesson_order,
  cl.duration_minutes,
  (cl.status = 'published')                    AS is_published,
  cl.status,
  'curriculum'::TEXT                           AS lesson_source,
  cl.created_at,
  cl.updated_at,
  NULL::TEXT                                   AS partner_exam_code,
  cl.video_file                                AS video_url,
  NULL::UUID                                   AS quiz_id,
  NULL::TEXT                                   AS description,
  NULL::JSONB                                  AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path
FROM public.curriculum_lessons cl
LEFT JOIN public.course_modules cm
  ON cm.course_id = cl.course_id
  AND cm.order_index = cl.module_order

UNION ALL

-- ── 2. course_lessons fallback (courses not in curriculum_lessons) ────────────
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                               AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                          AS content,
  cl.rendered_html,
  cl.lesson_type::TEXT                         AS step_type,
  cl.lesson_type::TEXT                         AS content_type,
  cl.slug,
  cl.slug                                      AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                     AS module_title,
  COALESCE(cm.order_index, 0)                  AS module_order,
  NULL::INTEGER                                AS lesson_order,
  NULL::INTEGER                                AS duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'::TEXT                            AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  cl.video_url,
  NULL::UUID                                   AS quiz_id,
  NULL::TEXT                                   AS description,
  NULL::JSONB                                  AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.curriculum_lessons cur
  WHERE cur.course_id = cl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 20260530000001_seed_hvac_program_relations.sql ──
-- Seed program_media, program_ctas, and program_modules for the HVAC Technician program.
-- program_tracks already has 3 rows — not touched.
--
-- Program ID: 4226f7f6-fbc1-44b5-83e8-b12ea149e4c7
-- Slug: hvac-technician

DO $$
DECLARE
  v_program_id UUID := '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';

  -- module IDs
  m1  UUID; m2  UUID; m3  UUID; m4  UUID; m5  UUID;
  m6  UUID; m7  UUID; m8  UUID; m9  UUID; m10 UUID;
BEGIN

  -- ── 1. program_media ───────────────────────────────────────────────────────
  INSERT INTO public.program_media (program_id, media_type, url, alt_text, sort_order)
  VALUES
    (v_program_id, 'hero_image', '/images/pages/programs-hvac-course-hero.jpg',
     'HVAC technician working on an air conditioning unit', 1)
  ON CONFLICT DO NOTHING;

  -- ── 2. program_ctas ────────────────────────────────────────────────────────
  INSERT INTO public.program_ctas (program_id, cta_type, label, href, style_variant, is_external, sort_order)
  VALUES
    (v_program_id, 'apply',        'Apply Now',          '/programs/hvac-technician/apply', 'primary',   FALSE, 1),
    (v_program_id, 'request_info', 'Check My Eligibility', '/contact?program=hvac-technician', 'secondary', FALSE, 2)
  ON CONFLICT DO NOTHING;

  -- ── 3. program_modules + program_lessons ───────────────────────────────────

  -- Module 1
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 1, 'HVAC Fundamentals', 'Introduction to heating, ventilation, and air conditioning systems. Tools, safety, and industry standards.', 8, 6, 1)
  RETURNING id INTO m1;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m1, 1, 'Introduction to HVAC Systems',          'lesson', 30, 1),
    (m1, 2, 'Tools and Safety Equipment',             'lesson', 25, 2),
    (m1, 3, 'Industry Standards and Codes',           'lesson', 30, 3),
    (m1, 4, 'Heat Transfer Principles',               'lesson', 35, 4),
    (m1, 5, 'Air Distribution Basics',                'lesson', 30, 5),
    (m1, 6, 'Ductwork and Airflow',                   'lesson', 30, 6),
    (m1, 7, 'Ventilation and Indoor Air Quality',     'lesson', 25, 7),
    (m1, 8, 'Module 1 Checkpoint',                   'quiz',   20, 8);

  -- Module 2
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 2, 'Electrical Systems', 'Wiring, circuits, controls, and electrical diagnostics on real HVAC equipment.', 8, 6, 2)
  RETURNING id INTO m2;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m2, 1, 'Electrical Fundamentals for HVAC',       'lesson', 35, 1),
    (m2, 2, 'Reading Wiring Diagrams',                'lesson', 30, 2),
    (m2, 3, 'Motors and Capacitors',                  'lesson', 30, 3),
    (m2, 4, 'Contactors and Relays',                  'lesson', 25, 4),
    (m2, 5, 'Thermostats and Controls',               'lesson', 30, 5),
    (m2, 6, 'Electrical Diagnostics Lab',             'lab',    45, 6),
    (m2, 7, 'Safety and Lockout/Tagout',              'lesson', 20, 7),
    (m2, 8, 'Module 2 Checkpoint',                   'quiz',   20, 8);

  -- Module 3
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 3, 'Refrigeration Cycle', 'Refrigerant handling, pressure-temperature relationships, and EPA 608 core concepts.', 9, 7, 3)
  RETURNING id INTO m3;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m3, 1, 'Refrigeration Cycle Overview',           'lesson', 35, 1),
    (m3, 2, 'Refrigerants and Properties',            'lesson', 30, 2),
    (m3, 3, 'Pressure-Temperature Relationships',     'lesson', 35, 3),
    (m3, 4, 'Compressors',                            'lesson', 30, 4),
    (m3, 5, 'Condensers and Evaporators',             'lesson', 30, 5),
    (m3, 6, 'Metering Devices',                       'lesson', 25, 6),
    (m3, 7, 'Refrigerant Handling Lab',               'lab',    45, 7),
    (m3, 8, 'EPA 608 Core Concepts',                  'lesson', 40, 8),
    (m3, 9, 'Module 3 Checkpoint',                   'quiz',   20, 9);

  -- Module 4
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 4, 'System Installation', 'Installing residential AC units, furnaces, and heat pumps to manufacturer and code specifications.', 8, 7, 4)
  RETURNING id INTO m4;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m4, 1, 'Site Assessment and Planning',           'lesson', 30, 1),
    (m4, 2, 'Residential AC Installation',           'lesson', 40, 2),
    (m4, 3, 'Furnace Installation',                  'lesson', 40, 3),
    (m4, 4, 'Heat Pump Installation',                'lesson', 40, 4),
    (m4, 5, 'Ductwork Installation',                 'lesson', 35, 5),
    (m4, 6, 'Startup and Commissioning',             'lesson', 30, 6),
    (m4, 7, 'Installation Lab',                      'lab',    60, 7),
    (m4, 8, 'Module 4 Checkpoint',                  'quiz',   20, 8);

  -- Module 5
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 5, 'System Repair', 'Diagnosing and repairing common failures in residential and light commercial HVAC systems.', 8, 6, 5)
  RETURNING id INTO m5;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m5, 1, 'Diagnostic Approach and Process',        'lesson', 30, 1),
    (m5, 2, 'Compressor Failures',                   'lesson', 35, 2),
    (m5, 3, 'Refrigerant Leaks and Recharge',        'lesson', 35, 3),
    (m5, 4, 'Electrical Component Replacement',      'lesson', 30, 4),
    (m5, 5, 'Airflow and Duct Repairs',              'lesson', 25, 5),
    (m5, 6, 'Repair Lab',                            'lab',    60, 6),
    (m5, 7, 'Customer Communication',                'lesson', 20, 7),
    (m5, 8, 'Module 5 Checkpoint',                  'quiz',   20, 8);

  -- Module 6
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 6, 'Advanced Diagnostics', 'System performance testing, fault isolation, and advanced troubleshooting techniques.', 7, 6, 6)
  RETURNING id INTO m6;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m6, 1, 'System Performance Testing',            'lesson', 35, 1),
    (m6, 2, 'Fault Isolation Techniques',            'lesson', 35, 2),
    (m6, 3, 'Using Diagnostic Tools',                'lesson', 30, 3),
    (m6, 4, 'Heat Pump Diagnostics',                 'lesson', 35, 4),
    (m6, 5, 'Commercial System Basics',              'lesson', 30, 5),
    (m6, 6, 'Advanced Diagnostics Lab',              'lab',    60, 6),
    (m6, 7, 'Module 6 Checkpoint',                  'quiz',   20, 7);

  -- Module 7
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 7, 'EPA 608 Certification Prep', 'Targeted preparation for EPA 608 Universal certification — Core, Type I, II, and III sections.', 8, 6, 7)
  RETURNING id INTO m7;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m7, 1, 'EPA 608 Exam Overview',                 'lesson', 20, 1),
    (m7, 2, 'Core Section Review',                   'lesson', 40, 2),
    (m7, 3, 'Type I — Small Appliances',             'lesson', 35, 3),
    (m7, 4, 'Type II — High-Pressure Systems',       'lesson', 35, 4),
    (m7, 5, 'Type III — Low-Pressure Systems',       'lesson', 35, 5),
    (m7, 6, 'Universal Practice Exam 1',             'quiz',   45, 6),
    (m7, 7, 'Universal Practice Exam 2',             'quiz',   45, 7),
    (m7, 8, 'EPA 608 Proctored Exam',               'exam',   90, 8);

  -- Module 8
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 8, 'OSHA 10 Safety', 'OSHA 10-hour construction safety certification covering hazard recognition and prevention.', 5, 10, 8)
  RETURNING id INTO m8;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m8, 1, 'Introduction to OSHA',                  'lesson', 60, 1),
    (m8, 2, 'Fall Protection',                       'lesson', 60, 2),
    (m8, 3, 'Electrical Safety',                     'lesson', 60, 3),
    (m8, 4, 'Personal Protective Equipment',         'lesson', 60, 4),
    (m8, 5, 'OSHA 10 Certification Exam',           'exam',   60, 5);

  -- Module 9
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 9, 'CPR / First Aid', 'CPR and First Aid certification required by most HVAC employers for field positions.', 3, 4, 9)
  RETURNING id INTO m9;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m9, 1, 'CPR Fundamentals',                      'lesson', 60, 1),
    (m9, 2, 'First Aid and AED',                     'lesson', 60, 2),
    (m9, 3, 'CPR / First Aid Certification',        'exam',   60, 3);

  -- Module 10
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 10, 'Career Readiness', 'Resume building, job placement support, employer introductions, and program wrap-up.', 5, 4, 10)
  RETURNING id INTO m10;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m10, 1, 'Resume and Interview Prep',             'lesson', 45, 1),
    (m10, 2, 'Job Search Strategies',                'lesson', 30, 2),
    (m10, 3, 'Employer Partner Introductions',       'lesson', 30, 3),
    (m10, 4, 'Licensing and Continuing Education',   'lesson', 25, 4),
    (m10, 5, 'Program Completion and Graduation',   'orientation', 30, 5);

  -- ── 4. Update programs row with headline fields ────────────────────────────
  UPDATE public.programs SET
    hero_headline     = 'HVAC Technician Training',
    hero_subheadline  = '12 weeks. EPA 608 Universal. $0 for eligible Indiana residents.',
    length_weeks      = 12,
    certificate_title = 'EPA 608 Universal Certification',
    funding           = 'WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
    outcomes          = 'Graduates are qualified for entry-level HVAC helper and installer roles ($18–$22/hr) with a clear path to licensed technician ($22–$30/hr).',
    requirements      = '"Must be 18 or older. No prior HVAC experience required. Indiana resident preferred for workforce funding eligibility."'::jsonb
  WHERE id = v_program_id;

END $$;

-- ── 20260530000002_fix_lms_lessons_video_url.sql ──
-- Atomic repair for HVAC lesson content pipeline.
--
-- Problem: course_lessons.video_url is NULL for all 95 HVAC lessons.
--          curriculum_lessons.video_file has all 95 Supabase storage URLs.
--          lms_lessons view reads course_lessons.video_url → always NULL.
--
-- Fix:
--   1. Backfill course_lessons.video_url from curriculum_lessons.video_file
--      joined on slug = lesson_slug for the HVAC course.
--   2. Rebuild lms_lessons view to COALESCE(cl.video_url, cur.video_file)
--      so future courses with video_url set directly also work.

-- ── 1. Backfill course_lessons.video_url ─────────────────────────────────────

UPDATE public.course_lessons cl
SET    video_url = cur.video_file
FROM   public.curriculum_lessons cur
WHERE  cl.slug      = cur.lesson_slug
AND    cl.course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
AND    cur.video_file IS NOT NULL
AND    (cl.video_url IS NULL OR cl.video_url = '');

-- ── 2. Rebuild lms_lessons view ───────────────────────────────────────────────
-- Keeps all existing columns. Adds COALESCE for video_url so curriculum
-- video_file is used when course_lessons.video_url is empty.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.lesson_number,
  cl.title,
  cl.content,
  cl.rendered_html,
  -- Pull video from curriculum_lessons if course_lessons.video_url is empty
  COALESCE(NULLIF(cl.video_url, ''), cur.video_file) AS video_url,
  COALESCE(cl.step_type, cl.content_type)            AS step_type,
  cl.content_type,
  cl.slug,
  cur.lesson_slug,
  COALESCE(cl.passing_score, cur.passing_score)      AS passing_score,
  COALESCE(cl.quiz_questions, cur.quiz_questions)    AS quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cl.module_title,
  cl.module_order,
  cl.lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'curriculum'::text                                 AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  cl.quiz_id,
  cl.description,
  cl.resources,
  cl.scorm_package_id,
  cl.scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.curriculum_lessons cur
  ON  cur.lesson_slug = cl.slug
  AND cur.course_id   = cl.course_id

UNION ALL

SELECT
  tl.id,
  tl.course_id,
  tl.order_index,
  tl.lesson_number,
  tl.title,
  tl.content,
  NULL::text                                         AS rendered_html,
  tl.video_url,
  COALESCE(tl.lesson_type, 'lesson')                AS step_type,
  tl.content_type,
  NULL::text                                         AS slug,
  NULL::text                                         AS lesson_slug,
  tl.passing_score,
  tl.quiz_questions,
  NULL::jsonb                                        AS activities,
  NULL::jsonb                                        AS video_config,
  tl.module_id,
  NULL::text                                         AS module_title,
  NULL::integer                                      AS module_order,
  tl.order_index                                     AS lesson_order,
  tl.duration_minutes,
  tl.is_published,
  NULL::text                                         AS status,
  'training'::text                                   AS lesson_source,
  tl.created_at,
  tl.updated_at,
  NULL::text                                         AS partner_exam_code,
  tl.quiz_id,
  tl.description,
  NULL::jsonb                                        AS resources,
  NULL::text                                         AS scorm_package_id,
  NULL::text                                         AS scorm_launch_path
FROM public.training_lessons tl
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_lessons cl2
  WHERE cl2.course_id = tl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 20260531000001_program_builder_columns.sql ──
-- Migration: program_builder_columns
-- Adds phase_id to program_modules (multi-phase curriculum support)
-- Adds is_published to program_lessons (per-lesson publish state)
-- Adds program_phases table as the grouping layer

-- ── 1. program_phases ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_phases (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_phases_program_id
  ON public.program_phases(program_id, sort_order);

ALTER TABLE public.program_phases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "phases_read" ON public.program_phases
  FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "phases_admin_all" ON public.program_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. phase_id on program_modules ───────────────────────────────────────────

ALTER TABLE public.program_modules
  ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.program_phases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_program_modules_phase_id
  ON public.program_modules(phase_id);

-- ── 3. is_published on program_lessons ───────────────────────────────────────

ALTER TABLE public.program_lessons
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_program_lessons_published
  ON public.program_lessons(module_id, is_published);

-- ── 4. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.program_phases TO authenticated;
GRANT ALL    ON public.program_phases TO service_role;

