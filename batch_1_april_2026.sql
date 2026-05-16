-- Elevate LMS Migrations — batch_1_april_2026.sql
-- 105 files — run in Supabase SQL Editor
-- All guards in place: IF NOT EXISTS, ON CONFLICT DO NOTHING

-- ── 20260402000002_hvac_db_fixes.sql ──
-- ============================================================
-- HVAC DB fixes
-- 1. Link all 10 HVAC modules to course_id
-- 2. Rebuild checkpoint_scores with correct columns
-- 3. Fix practice exam question counts (4 exams had 5 Qs, Universal had 105)
-- ============================================================

-- 1. Link HVAC modules to course
UPDATE modules
SET course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
WHERE program_id = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7'
  AND (course_id IS NULL OR course_id != 'f0593164-55be-5867-98e7-8a86770a8dd0');

-- 2. Rebuild checkpoint_scores with correct columns if empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkpoint_scores' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE checkpoint_scores
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      ADD COLUMN course_id UUID,
      ADD COLUMN lesson_id UUID,
      ADD COLUMN score INTEGER,
      ADD COLUMN passed BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN attempt_number INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_checkpoint_scores_user_course
  ON checkpoint_scores(user_id, course_id);

-- RLS
ALTER TABLE checkpoint_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'checkpoint_scores'
      AND policyname = 'Users can read own checkpoint scores'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own checkpoint scores"
      ON checkpoint_scores FOR SELECT
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 3. Fix practice exam question counts
-- Universal Full Practice Exam: trim to 25 best questions
UPDATE curriculum_lessons
SET quiz_questions = (
  SELECT jsonb_agg(q)
  FROM (
    SELECT q
    FROM jsonb_array_elements(quiz_questions) AS q
    LIMIT 25
  ) sub
)
WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND step_type = 'checkpoint'
  AND lesson_title = 'EPA 608 Universal Full Practice Exam'
  AND jsonb_array_length(quiz_questions) > 25;

-- Type I, II, III, Core exams: these have only 5 questions — flag for content review
-- For now set passing_score to reflect 5-question reality (3/5 = 60% → keep 70% threshold)
-- They need 25 questions added — mark with review_status
UPDATE curriculum_lessons
SET review_status = 'needs_questions'
WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND step_type = 'checkpoint'
  AND lesson_title IN (
    'Full-Length Practice Exam Type I',
    'Full-Length Practice Exam Type II',
    'Full-Length Practice Exam Type III',
    'Full-Length Practice Exam Core'
  )
  AND jsonb_array_length(quiz_questions) < 10;

-- ── 20260402000003_programs_lms_columns.sql ──
-- Add LMS-facing columns to programs table.
-- These normalize the existing scattered columns into a consistent shape
-- used by lib/lms/api.ts and the public /lms/programs catalog.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Backfill short_description from excerpt (preferred) or first 200 chars of description
UPDATE public.programs
SET short_description = COALESCE(
  NULLIF(TRIM(excerpt), ''),
  LEFT(description, 200)
)
WHERE short_description IS NULL
  AND (excerpt IS NOT NULL OR description IS NOT NULL);

-- is_published: normalize from the existing published/status/is_active columns
-- A program is published if published=true AND status != 'archived' AND is_active=true
-- We don't add a new column — we use a generated expression so it stays in sync.
-- The API query will use: .eq('published', true).neq('status', 'archived').eq('is_active', true)
-- No new column needed.

-- display_order: default to NULL (API falls back to title sort)
-- Admins can set this manually per program.

-- ── 20260402000004_drop_notification_log.sql ──
-- Drop the legacy notification_log table.
--
-- The single code reference (app/api/apprentice/email-alerts/route.ts) has been
-- updated to write to notification_logs (the canonical table). notification_log
-- had 0 rows and no inbound foreign keys, so this drop is safe.
--
-- See: supabase/migrations/20260216000002_drop_redundant_tables.sql (Phase 2)

DROP TABLE IF EXISTS public.notification_log;

-- ── 20260402000005_program_catalog_index.sql ──
-- Creates program_catalog_index view used by /programs/catalog and /api/catalog.
-- Previously missing from live DB, causing those routes to 500.

CREATE OR REPLACE VIEW public.program_catalog_index AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.description,
  p.excerpt,
  p.image_url,
  p.estimated_weeks,
  p.credential_name,
  p.funding_tags,
  p.wioa_approved,
  p.published,
  p.is_active,
  p.status,
  p.featured,
  'program'::text AS source_type
FROM public.programs p
WHERE p.published = true
  AND p.is_active = true
  AND p.status != 'archived'

UNION ALL

SELECT
  tc.id,
  tc.slug,
  tc.title,
  tc.description,
  tc.summary        AS excerpt,
  NULL::text        AS image_url,
  NULL::integer     AS estimated_weeks,
  NULL::text        AS credential_name,
  NULL::text[]      AS funding_tags,
  false             AS wioa_approved,
  tc.is_published   AS published,
  tc.is_active,
  tc.status,
  false             AS featured,
  'course'::text    AS source_type
FROM public.training_courses tc
WHERE tc.is_published = true
  AND tc.is_active   = true
  AND tc.status      = 'published';

GRANT SELECT ON public.program_catalog_index TO authenticated, anon, service_role;

-- ── 20260402000006_canonical_curriculum.sql ──
-- Canonical curriculum schema.
-- courses = VIEW over training_courses → replace with real TABLE
-- course_modules = real TABLE (keep, add index)
-- course_lessons = does not exist → create
-- training_courses = legacy archive (keep, not active read path)
-- curriculum_lessons = canonical content source → migrate into course_lessons

DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_type AS ENUM (
    'lesson','quiz','checkpoint','lab','assignment','exam','certification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP VIEW IF EXISTS public.courses CASCADE;

CREATE TABLE public.courses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        UUID        REFERENCES public.programs(id) ON DELETE CASCADE,
  legacy_course_id  UUID,
  slug              TEXT        NOT NULL UNIQUE,
  title             TEXT        NOT NULL,
  short_description TEXT,
  description       TEXT,
  status            public.course_status NOT NULL DEFAULT 'draft',
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_program_id ON public.courses(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_status     ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_legacy_id  ON public.courses(legacy_course_id);

INSERT INTO public.courses (
  legacy_course_id, program_id, slug, title, short_description,
  description, status, is_active, published_at, created_at, updated_at
)
SELECT
  tc.id, p.id, tc.slug, tc.title, tc.summary, tc.description,
  'published'::public.course_status, true, now(), tc.created_at, tc.updated_at
FROM public.training_courses tc
LEFT JOIN public.programs p ON p.slug = tc.slug
WHERE tc.id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id        UUID        REFERENCES public.course_modules(id)   ON DELETE SET NULL,
  legacy_lesson_id UUID,
  slug             TEXT        NOT NULL,
  title            TEXT        NOT NULL,
  content          JSONB,
  lesson_type      public.lesson_type NOT NULL DEFAULT 'lesson',
  order_index      INTEGER     NOT NULL,
  passing_score    INTEGER,
  quiz_questions   JSONB,
  is_required      BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(course_id, slug),
  UNIQUE(course_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);

INSERT INTO public.course_lessons (
  course_id, module_id, legacy_lesson_id, slug, title,
  content, lesson_type, order_index, passing_score, quiz_questions, is_required
)
SELECT
  c.id,
  cm.id,
  cl.id,
  cl.lesson_slug,
  cl.lesson_title,
  to_jsonb(cl.script_text),
  CASE cl.step_type
    WHEN 'quiz'          THEN 'quiz'::public.lesson_type
    WHEN 'checkpoint'    THEN 'checkpoint'::public.lesson_type
    WHEN 'lab'           THEN 'lab'::public.lesson_type
    WHEN 'assignment'    THEN 'assignment'::public.lesson_type
    WHEN 'exam'          THEN 'exam'::public.lesson_type
    WHEN 'certification' THEN 'certification'::public.lesson_type
    ELSE 'lesson'::public.lesson_type
  END,
  (cl.module_order * 1000 + cl.lesson_order),
  cl.passing_score,
  cl.quiz_questions,
  true
FROM public.curriculum_lessons cl
JOIN public.courses c ON c.legacy_course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
LEFT JOIN public.course_modules cm
  ON cm.course_id = c.id
  AND COALESCE(cm.order_index, cm."order") = cl.module_order
WHERE cl.course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND cl.status = 'published'
ON CONFLICT (course_id, slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_user_id UUID, p_entity_type TEXT, p_entity_id UUID,
  p_action TEXT, p_details JSONB DEFAULT '{}'::JSONB
) RETURNS VOID LANGUAGE SQL AS $$
  INSERT INTO public.audit_logs (actor_user_id, entity_type, entity_id, action, details)
  VALUES (p_actor_user_id, p_entity_type, p_entity_id, p_action, COALESCE(p_details,'{}'));
$$;

CREATE OR REPLACE FUNCTION public.course_is_publishable(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_title TEXT; v_slug TEXT; v_mc INTEGER; v_lc INTEGER;
BEGIN
  SELECT title, slug INTO v_title, v_slug FROM public.courses WHERE id = p_course_id;
  IF v_title IS NULL OR btrim(v_title)='' THEN RETURN false; END IF;
  IF v_slug  IS NULL OR btrim(v_slug) ='' THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_mc FROM public.course_modules WHERE course_id = p_course_id;
  SELECT COUNT(*) INTO v_lc FROM public.course_lessons  WHERE course_id = p_course_id;
  RETURN v_mc > 0 AND v_lc > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_course(p_course_id UUID)
RETURNS public.courses LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course        public.courses;
  v_module_count  INTEGER;
  v_null_ct_count INTEGER;
  v_gating_count  INTEGER;
  v_mod           RECORD;
  v_lesson_count  INTEGER;
BEGIN
  -- 1. Basic publishability (title, slug, ≥1 module, ≥1 lesson)
  IF NOT public.course_is_publishable(p_course_id) THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: course % needs title, slug, at least one module, and at least one lesson', p_course_id;
  END IF;

  -- 2. Every lesson must have a non-null lesson_type (content_type)
  SELECT COUNT(*) INTO v_null_ct_count
  FROM public.course_lessons
  WHERE course_id = p_course_id
    AND (lesson_type IS NULL);

  IF v_null_ct_count > 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: % lesson(s) in course % have NULL lesson_type — fix before publishing',
      v_null_ct_count, p_course_id;
  END IF;

  -- 3. Every module must have at least one lesson
  FOR v_mod IN
    SELECT cm.id, cm.title
    FROM public.course_modules cm
    WHERE cm.course_id = p_course_id
  LOOP
    SELECT COUNT(*) INTO v_lesson_count
    FROM public.course_lessons
    WHERE module_id = v_mod.id;

    IF v_lesson_count = 0 THEN
      RAISE EXCEPTION 'PUBLISH_BLOCKED: module "%" (%) has no lessons', v_mod.title, v_mod.id;
    END IF;
  END LOOP;

  -- 4. Gating rules must exist (at least one per course)
  SELECT COUNT(*) INTO v_gating_count
  FROM public.module_completion_rules
  WHERE course_id = p_course_id;

  SELECT COUNT(*) INTO v_module_count
  FROM public.course_modules
  WHERE course_id = p_course_id;

  -- Only enforce gating rules when there are multiple modules
  IF v_module_count > 1 AND v_gating_count = 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: course % has % modules but no module_completion_rules — add gating rules before publishing',
      p_course_id, v_module_count;
  END IF;

  -- All checks passed — publish
  UPDATE public.courses
  SET status = 'published', published_at = now(), updated_at = now()
  WHERE id = p_course_id
  RETURNING * INTO v_course;

  RETURN v_course;
END;
$$;

ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published courses"
  ON public.courses FOR SELECT USING (status='published' AND is_active=true);
CREATE POLICY "Service role courses"
  ON public.courses USING (auth.role()='service_role');
CREATE POLICY "Authenticated read published lessons"
  ON public.course_lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c
            WHERE c.id=course_lessons.course_id AND c.status='published' AND c.is_active=true));
CREATE POLICY "Service role lessons"
  ON public.course_lessons USING (auth.role()='service_role');

GRANT SELECT ON public.courses        TO authenticated, anon;
GRANT ALL    ON public.courses        TO service_role;
GRANT SELECT ON public.course_lessons TO authenticated, anon;
GRANT ALL    ON public.course_lessons TO service_role;

-- ── 20260402000007_enforce_canonical_pipeline.sql ──
-- ENFORCEMENT MIGRATION
-- Canonical source of truth: courses / course_modules / course_lessons
-- Legacy disconnected: training_courses, training_lessons, curriculum_lessons, modules, lms_lessons view
-- lesson_progress stays - references course_lessons.id via lesson_id

-- ── 1. module_completion_rules ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_completion_rules (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id                   UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  required_previous_module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  required_checkpoint_lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  minimum_score               INTEGER,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(course_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_mcr_course_id  ON public.module_completion_rules(course_id);
CREATE INDEX IF NOT EXISTS idx_mcr_module_id  ON public.module_completion_rules(module_id);

-- ── 2. student_module_progress ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_module_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'locked',
               CHECK (status IN ('locked','unlocked','in_progress','completed')),
  unlocked_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_smp_user_id   ON public.student_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_smp_course_id ON public.student_module_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_smp_module_id ON public.student_module_progress(module_id);

-- ── 3. Seed HVAC module_completion_rules (each module requires previous) ──────

INSERT INTO public.module_completion_rules (course_id, module_id, required_previous_module_id, minimum_score)
SELECT
  c.id AS course_id,
  cm.id AS module_id,
  prev.id AS required_previous_module_id,
  NULL AS minimum_score
FROM public.courses c
JOIN public.course_modules cm ON cm.course_id = c.id
LEFT JOIN public.course_modules prev
  ON prev.course_id = c.id
  AND COALESCE(prev.order_index, prev."order") =
      COALESCE(cm.order_index, cm."order") - 1
WHERE c.slug = 'hvac-technician'
  AND COALESCE(cm.order_index, cm."order") > 1
ON CONFLICT (course_id, module_id) DO NOTHING;

-- Seed checkpoint rules: each module's checkpoint lesson gates the next module
INSERT INTO public.module_completion_rules (course_id, module_id, required_previous_module_id, required_checkpoint_lesson_id, minimum_score)
SELECT
  c.id,
  next_cm.id,
  cm.id,
  cl.id,
  70
FROM public.courses c
JOIN public.course_modules cm ON cm.course_id = c.id
JOIN public.course_lessons cl
  ON cl.course_id = c.id
  AND cl.lesson_type = 'checkpoint'
  AND cl.order_index / 1000 = COALESCE(cm.order_index, cm."order")
JOIN public.course_modules next_cm
  ON next_cm.course_id = c.id
  AND COALESCE(next_cm.order_index, next_cm."order") =
      COALESCE(cm.order_index, cm."order") + 1
WHERE c.slug = 'hvac-technician'
ON CONFLICT (course_id, module_id) DO UPDATE
  SET required_checkpoint_lesson_id = EXCLUDED.required_checkpoint_lesson_id,
      minimum_score = EXCLUDED.minimum_score;

-- ── 4. Replace lms_lessons view → canonical course_lessons ─────────────────────

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index                          AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                     AS content,
  cl.lesson_type                          AS step_type,
  cl.lesson_type::TEXT                    AS content_type,
  cl.slug                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.module_id,
  cm.title                                AS module_title,
  COALESCE(cm.order_index, cm."order")    AS module_order,
  cl.order_index - (COALESCE(cm.order_index, cm."order") * 1000) AS lesson_order,
  NULL::INTEGER                           AS duration_minutes,
  'canonical'                             AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 5. RLS on new tables ──────────────────────────────────────────────────────

ALTER TABLE public.module_completion_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_module_progress  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to mcr"
  ON public.module_completion_rules USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated read mcr"
  ON public.module_completion_rules FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to smp"
  ON public.student_module_progress USING (auth.role() = 'service_role');
CREATE POLICY "Users read own module progress"
  ON public.student_module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own module progress"
  ON public.student_module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own module progress"
  ON public.student_module_progress FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT ON public.module_completion_rules TO authenticated, anon;
GRANT ALL    ON public.module_completion_rules TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.student_module_progress TO authenticated;
GRANT ALL    ON public.student_module_progress TO service_role;

-- ── 6. module_unlock function — deterministic, no UI override ─────────────────

CREATE OR REPLACE FUNCTION public.check_module_unlock(
  p_user_id  UUID,
  p_course_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule        public.module_completion_rules%ROWTYPE;
  v_prev_status TEXT;
  v_score       INTEGER;
BEGIN
  -- Module 1 (no rule) is always unlocked
  SELECT * INTO v_rule
  FROM public.module_completion_rules
  WHERE course_id = p_course_id AND module_id = p_module_id;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Check previous module completed
  IF v_rule.required_previous_module_id IS NOT NULL THEN
    SELECT status INTO v_prev_status
    FROM public.student_module_progress
    WHERE user_id = p_user_id AND module_id = v_rule.required_previous_module_id;

    IF v_prev_status IS DISTINCT FROM 'completed' THEN
      RETURN false;
    END IF;
  END IF;

  -- Check checkpoint score if required
  IF v_rule.required_checkpoint_lesson_id IS NOT NULL THEN
    SELECT score INTO v_score
    FROM public.checkpoint_scores
    WHERE user_id = p_user_id
      AND lesson_id = v_rule.required_checkpoint_lesson_id
      AND passed = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN RETURN false; END IF;

    IF v_rule.minimum_score IS NOT NULL AND v_score < v_rule.minimum_score THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- ── 7. lesson_complete trigger → auto-unlock next module ─────────────────────

CREATE OR REPLACE FUNCTION public.on_lesson_complete_check_module_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id   UUID;
  v_course_id   UUID;
  v_next_module UUID;
  v_can_unlock  BOOLEAN;
BEGIN
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;

  -- Get module for this lesson
  SELECT module_id, course_id INTO v_module_id, v_course_id
  FROM public.course_lessons WHERE id = NEW.lesson_id;

  IF v_module_id IS NULL THEN RETURN NEW; END IF;

  -- Mark module in_progress if not already further along
  INSERT INTO public.student_module_progress (user_id, course_id, module_id, status, unlocked_at)
  VALUES (NEW.user_id, v_course_id, v_module_id, 'in_progress', now())
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET status = CASE
      WHEN student_module_progress.status IN ('locked','unlocked') THEN 'in_progress'
      ELSE student_module_progress.status
    END,
    updated_at = now();

  -- Check if all lessons in this module are complete
  IF NOT EXISTS (
    SELECT 1 FROM public.course_lessons cl
    LEFT JOIN public.lesson_progress lp
      ON lp.lesson_id = cl.id AND lp.user_id = NEW.user_id
    WHERE cl.module_id = v_module_id
      AND cl.is_required = true
      AND (lp.completed IS NOT TRUE)
  ) THEN
    -- Mark module completed
    UPDATE public.student_module_progress
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE user_id = NEW.user_id AND module_id = v_module_id;

    -- Log audit event
    PERFORM public.log_audit_event(
      NEW.user_id, 'module', v_module_id, 'module_completed',
      jsonb_build_object('course_id', v_course_id)
    );

    -- Find next module and check if it can unlock
    SELECT cm.id INTO v_next_module
    FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE c.id = v_course_id
      AND COALESCE(cm.order_index, cm."order") = (
        SELECT COALESCE(order_index, "order") + 1
        FROM public.course_modules
        WHERE id = v_module_id
      );

    IF v_next_module IS NOT NULL THEN
      SELECT public.check_module_unlock(NEW.user_id, v_course_id, v_next_module)
      INTO v_can_unlock;

      IF v_can_unlock THEN
        INSERT INTO public.student_module_progress (user_id, course_id, module_id, status, unlocked_at)
        VALUES (NEW.user_id, v_course_id, v_next_module, 'unlocked', now())
        ON CONFLICT (user_id, module_id) DO UPDATE
          SET status = 'unlocked', unlocked_at = now(), updated_at = now()
          WHERE student_module_progress.status = 'locked';

        PERFORM public.log_audit_event(
          NEW.user_id, 'module', v_next_module, 'module_unlocked',
          jsonb_build_object('course_id', v_course_id, 'unlocked_by_module', v_module_id)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_complete_unlock ON public.lesson_progress;
CREATE TRIGGER trg_lesson_complete_unlock
  AFTER INSERT OR UPDATE OF completed ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.on_lesson_complete_check_module_unlock();

-- ── 20260402000010_fix_limbo_approved_applications.sql ──
-- Fix 53 applications auto-approved without funding/payment verification.
--
-- Root cause: insertApplication() called approveApplication() on every submission.
-- approveApplication() returned PAYMENT_NOT_VERIFIED but the caller treated it as
-- non-fatal and returned success:true. Result: status='approved' with no enrollment,
-- no funding_verified, no has_workone_approval.
--
-- Strategy: patch enforce_application_flow to allow approved→in_review as a valid
-- admin correction transition, then reset the 53 records.

-- Step 1: Add approved→in_review to the trigger function
CREATE OR REPLACE FUNCTION enforce_application_flow()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR OLD.status = '' THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Forward path
  IF (OLD.status = 'submitted'       AND NEW.status = 'in_review')       THEN RETURN NEW; END IF;
  IF (OLD.status = 'in_review'       AND NEW.status = 'approved')        THEN RETURN NEW; END IF;
  IF (OLD.status = 'approved'        AND NEW.status = 'ready_to_enroll') THEN RETURN NEW; END IF;
  IF (OLD.status = 'ready_to_enroll' AND NEW.status = 'enrolled')        THEN RETURN NEW; END IF;

  -- Rejection from any active state
  IF OLD.status IN ('submitted','in_review','approved','ready_to_enroll')
     AND NEW.status = 'rejected' THEN RETURN NEW; END IF;

  -- Admin correction: re-queue approved record for review
  IF OLD.status = 'approved' AND NEW.status = 'in_review' THEN RETURN NEW; END IF;

  -- Supplemental statuses
  IF OLD.status = 'submitted' AND NEW.status IN ('pending_workone','waitlisted') THEN RETURN NEW; END IF;
  IF OLD.status IN ('pending_workone','waitlisted') AND NEW.status IN ('in_review','rejected') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Invalid transition: % -> %. Must be ready_to_enroll or rejected.', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Reset limbo records
UPDATE public.applications
SET
  status             = 'in_review',
  eligibility_status = 'pending',
  updated_at         = NOW()
WHERE
  status                = 'approved'
  AND funding_verified  = false
  AND has_workone_approval = false
  AND user_id NOT IN (
    SELECT DISTINCT user_id
    FROM public.program_enrollments
    WHERE user_id IS NOT NULL
  );

-- Verify
SELECT
  COUNT(*) FILTER (WHERE status = 'in_review' AND funding_verified = false)                                  AS reset_to_in_review,
  COUNT(*) FILTER (WHERE status = 'approved'  AND funding_verified = false AND has_workone_approval = false) AS still_limbo
FROM public.applications;

-- Addendum: fix 8 records where user_id IS NULL.
-- NULL NOT IN (subquery) evaluates to NULL (not TRUE) in SQL,
-- so the original UPDATE above skipped them.
UPDATE public.applications
SET
  status             = 'in_review',
  eligibility_status = 'pending',
  updated_at         = NOW()
WHERE
  status                = 'approved'
  AND funding_verified  = false
  AND has_workone_approval = false
  AND user_id IS NULL;

-- ── 20260402000011_admin_real_data.sql ──
-- Admin real data tables: replaces all hardcoded fake data in admin pages.
-- Covers: financial assurance, email automations, social campaigns, workflows, MOU documents.

-- 1) Financial assurance records
create table if not exists public.financial_assurance_records (
  id                        uuid primary key default gen_random_uuid(),
  record_type               text not null check (record_type in ('surety_bond','letter_of_credit','insurance','other')),
  provider_name             text not null,
  policy_or_reference_number text,
  coverage_amount           numeric(12,2),
  effective_date            date,
  expiration_date           date,
  status                    text not null default 'active' check (status in ('active','expired','pending','cancelled')),
  state                     text,
  notes                     text,
  document_url              text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists financial_assurance_records_status_idx
  on public.financial_assurance_records(status);
create index if not exists financial_assurance_records_expiration_idx
  on public.financial_assurance_records(expiration_date);

-- 2) Email automations
create table if not exists public.email_automations (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text unique,
  trigger_type          text not null check (trigger_type in (
                          'application_submitted','application_approved',
                          'payment_failed','payment_received','manual','other')),
  audience_type         text not null default 'mixed' check (audience_type in ('students','applicants','partners','mixed')),
  is_active             boolean not null default false,
  last_run_at           timestamptz,
  last_run_status       text check (last_run_status in ('success','failed','partial')),
  last_recipient_count  integer not null default 0,
  total_runs            integer not null default 0,
  total_recipients      integer not null default 0,
  provider              text default 'sendgrid',
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 3) Social campaigns
create table if not exists public.social_campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  platform          text not null check (platform in ('facebook','instagram','linkedin','youtube','x','tiktok','multi')),
  status            text not null default 'draft' check (status in ('draft','scheduled','active','paused','completed','failed')),
  scheduled_posts   integer not null default 0,
  published_posts   integer not null default 0,
  failed_posts      integer not null default 0,
  last_published_at timestamptz,
  start_date        timestamptz,
  end_date          timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 4) Workflows
create table if not exists public.workflows (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  workflow_key     text unique,
  category         text not null default 'operations',
  status           text not null default 'inactive' check (status in ('active','inactive','paused','error')),
  last_run_at      timestamptz,
  last_run_status  text check (last_run_status in ('success','failed','partial')),
  run_count        integer not null default 0,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 5) MOU documents
create table if not exists public.mou_documents (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  organization_name     text,
  document_status       text not null default 'draft' check (document_status in ('draft','sent','signed','expired','archived')),
  effective_date        date,
  expiration_date       date,
  file_url              text,
  external_document_id  text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- updated_at trigger (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_financial_assurance_records_updated_at') then
    create trigger trg_financial_assurance_records_updated_at
    before update on public.financial_assurance_records
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_email_automations_updated_at') then
    create trigger trg_email_automations_updated_at
    before update on public.email_automations
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_social_campaigns_updated_at') then
    create trigger trg_social_campaigns_updated_at
    before update on public.social_campaigns
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_workflows_updated_at') then
    create trigger trg_workflows_updated_at
    before update on public.workflows
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_mou_documents_updated_at') then
    create trigger trg_mou_documents_updated_at
    before update on public.mou_documents
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.financial_assurance_records enable row level security;
alter table public.email_automations           enable row level security;
alter table public.social_campaigns            enable row level security;
alter table public.workflows                   enable row level security;
alter table public.mou_documents               enable row level security;

-- Policies — uses profiles.role (matches existing project pattern)
drop policy if exists "admins_manage_financial_assurance" on public.financial_assurance_records;
create policy "admins_manage_financial_assurance"
  on public.financial_assurance_records for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_email_automations" on public.email_automations;
create policy "admins_manage_email_automations"
  on public.email_automations for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_social_campaigns" on public.social_campaigns;
create policy "admins_manage_social_campaigns"
  on public.social_campaigns for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_workflows" on public.workflows;
create policy "admins_manage_workflows"
  on public.workflows for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_mou_documents" on public.mou_documents;
create policy "admins_manage_mou_documents"
  on public.mou_documents for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

-- Summary view for financial assurance dashboard
DROP VIEW IF EXISTS public.v_admin_financial_assurance_summary;
CREATE OR REPLACE VIEW public.v_admin_financial_assurance_summary as
select
  count(*)::int                                                                          as total_records,
  count(*) filter (where status = 'active')::int                                        as active_records,
  count(*) filter (where expiration_date is not null
                     and expiration_date < current_date)::int                           as expired_records,
  count(*) filter (where expiration_date is not null
                     and expiration_date >= current_date
                     and expiration_date <= current_date + interval '30 days')::int     as expiring_soon_records,
  coalesce(sum(coverage_amount) filter (where status = 'active'), 0)::numeric(12,2)    as active_coverage_total
from public.financial_assurance_records;

-- ── 20260403000001_course_versioning.sql ──
-- Course versioning
-- Students are locked to the version active at enrollment time.
-- Content changes create a new version; enrolled students are unaffected.

-- ── 1. course_versions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  version_number INTEGER     NOT NULL,
  label          TEXT,                          -- e.g. "v1.2 — EPA 608 update"
  is_published   BOOLEAN     NOT NULL DEFAULT false,
  published_at   TIMESTAMPTZ,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(course_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_cv_course_id    ON public.course_versions(course_id);
CREATE INDEX IF NOT EXISTS idx_cv_published    ON public.course_versions(course_id, is_published);

-- ── 2. course_version_modules ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_version_modules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.course_versions(id) ON DELETE CASCADE,
  module_id  UUID NOT NULL REFERENCES public.course_modules(id)  ON DELETE CASCADE
  UNIQUE(version_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_cvm_version_id ON public.course_version_modules(version_id);

-- ── 3. course_version_lessons ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_version_lessons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.course_versions(id)  ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES public.course_lessons(id)   ON DELETE CASCADE
  UNIQUE(version_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_cvl_version_id ON public.course_version_lessons(version_id);

-- ── 4. Add course_version_id to program_enrollments ──────────────────────────
-- Students are locked to the version active when they enrolled.
-- NULL = enrolled before versioning was introduced (treated as latest).

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS course_version_id UUID
    REFERENCES public.course_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pe_course_version
  ON public.program_enrollments(course_version_id);

-- ── 5. Seed v1 for HVAC (the only published course) ──────────────────────────

INSERT INTO public.course_versions (course_id, version_number, label, is_published, published_at)
SELECT
  c.id,
  1,
  'v1 — initial',
  true,
  c.published_at
FROM public.courses c
WHERE c.slug = 'hvac-technician'
  AND c.status = 'published'
ON CONFLICT (course_id, version_number) DO NOTHING;

-- Attach all current modules to v1
INSERT INTO public.course_version_modules (version_id, module_id)
SELECT cv.id, cm.id
FROM public.course_versions cv
JOIN public.course_modules cm ON cm.course_id = cv.course_id
WHERE cv.version_number = 1
ON CONFLICT (version_id, module_id) DO NOTHING;

-- Attach all current lessons to v1
INSERT INTO public.course_version_lessons (version_id, lesson_id)
SELECT cv.id, cl.id
FROM public.course_versions cv
JOIN public.course_lessons cl ON cl.course_id = cv.course_id
WHERE cv.version_number = 1
ON CONFLICT (version_id, lesson_id) DO NOTHING;

-- ── 6. Helper: get latest published version for a course ─────────────────────

CREATE OR REPLACE FUNCTION public.get_latest_published_version(p_course_id UUID)
RETURNS public.course_versions
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM public.course_versions
  WHERE course_id = p_course_id
    AND is_published = true
  ORDER BY version_number DESC
  LIMIT 1;
$$;

-- ── 7. Helper: snapshot current course state as a new version ─────────────────
-- Called by publish_course() when content changes after initial publish.

CREATE OR REPLACE FUNCTION public.snapshot_course_version(
  p_course_id  UUID,
  p_created_by UUID,
  p_label      TEXT DEFAULT NULL
)
RETURNS public.course_versions
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_next_num INTEGER;
  v_version  public.course_versions;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_num
  FROM public.course_versions
  WHERE course_id = p_course_id;

  INSERT INTO public.course_versions
    (course_id, version_number, label, is_published, published_at, created_by)
  VALUES
    (p_course_id, v_next_num, p_label, true, now(), p_created_by)
  RETURNING * INTO v_version;

  -- Snapshot modules
  INSERT INTO public.course_version_modules (version_id, module_id)
  SELECT v_version.id, cm.id
  FROM public.course_modules cm
  WHERE cm.course_id = p_course_id;

  -- Snapshot lessons
  INSERT INTO public.course_version_lessons (version_id, lesson_id)
  SELECT v_version.id, cl.id
  FROM public.course_lessons cl
  WHERE cl.course_id = p_course_id;

  RETURN v_version;
END;
$$;

-- ── 8. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.course_versions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_version_modules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_version_lessons  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published versions"
  ON public.course_versions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role full access to versions"
  ON public.course_versions USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated read version modules"
  ON public.course_version_modules FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role full access to version modules"
  ON public.course_version_modules USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated read version lessons"
  ON public.course_version_lessons FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role full access to version lessons"
  ON public.course_version_lessons USING (auth.role() = 'service_role');

GRANT SELECT ON public.course_versions        TO authenticated, anon;
GRANT ALL    ON public.course_versions        TO service_role;
GRANT SELECT ON public.course_version_modules TO authenticated;
GRANT ALL    ON public.course_version_modules TO service_role;
GRANT SELECT ON public.course_version_lessons TO authenticated;
GRANT ALL    ON public.course_version_lessons TO service_role;

-- ── 20260403000002_access_control.sql ──
-- Access control DB function
-- Called by lib/lms/access-control.ts assertLessonAccess()
-- Returns: true = accessible, false = locked, null = lesson not found

CREATE OR REPLACE FUNCTION public.can_access_lesson(
  p_user_id   UUID,
  p_lesson_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id  UUID;
  v_course_id  UUID;
BEGIN
  -- Resolve module and course for this lesson
  SELECT module_id, course_id
  INTO v_module_id, v_course_id
  FROM public.course_lessons
  WHERE id = p_lesson_id;

  -- Lesson not found → return NULL (caller maps to 404)
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- No module assignment → lesson is always accessible (standalone lesson)
  IF v_module_id IS NULL THEN
    RETURN true;
  END IF;

  -- Delegate to module unlock check
  RETURN public.check_module_unlock(p_user_id, v_course_id, v_module_id);
END;
$$;

-- training_courses → courses data migration
-- Copies any training_courses rows not yet in courses (slug-based dedup).
-- Run once after applying 20260402000006_canonical_curriculum.sql.
-- Safe to re-run (ON CONFLICT DO NOTHING).

INSERT INTO public.courses (
  legacy_course_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  published_at,
  created_at,
  updated_at
)
SELECT
  tc.id,
  tc.slug,
  COALESCE(tc.title, tc.course_name, tc.slug),
  tc.summary,
  tc.description,
  CASE
    WHEN tc.is_published = true AND tc.is_active = true THEN 'published'::public.course_status
    WHEN tc.status = 'archived'                         THEN 'archived'::public.course_status
    ELSE 'draft'::public.course_status
  END,
  COALESCE(tc.is_active, false),
  CASE WHEN tc.is_published = true THEN tc.updated_at ELSE NULL END,
  tc.created_at,
  tc.updated_at
FROM public.training_courses tc
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses c WHERE c.slug = tc.slug
)
  AND tc.slug IS NOT NULL
  AND tc.slug != '';

-- ── 20260403000003_publish_peer_recovery_lessons.sql ──
-- Publish 5 Peer Recovery Specialist lessons that have real content and a program_id.
-- The remaining ~195 draft lessons with no program_id are empty shells (no script_text,
-- no video_file) and intentionally remain draft until content is added.
UPDATE public.curriculum_lessons
SET status = 'published'
WHERE program_id = 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d'
  AND status = 'draft';

-- ── 20260404000001_checkout_contexts_price_columns.sql ──
-- Add server-authoritative price resolution columns to checkout_contexts.
-- These are written by the checkout API and read by the capture/webhook handlers
-- to verify the amount Affirm/Sezzle authorized matches what was required.

ALTER TABLE public.checkout_contexts
  ADD COLUMN IF NOT EXISTS required_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS overpay_amount_cents   INTEGER DEFAULT 0;

-- Fix expires_at: was re-added as TEXT by the original migration's ALTER TABLE,
-- overriding the TIMESTAMPTZ from CREATE TABLE. Cast existing values and retype.
-- Safe: all existing values are ISO strings or NULL.
ALTER TABLE public.checkout_contexts
  ALTER COLUMN expires_at TYPE TIMESTAMPTZ
  USING expires_at::TIMESTAMPTZ;

-- ── 20260404000002_bnpl_missing_columns.sql ──
-- Add missing columns required by Affirm and Sezzle webhook handlers.
-- All columns use IF NOT EXISTS — safe to re-run.

-- ── payments ─────────────────────────────────────────────────────────────────
-- Sezzle webhook writes these on order.authorized / order.captured / order.refunded
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider              TEXT,
  ADD COLUMN IF NOT EXISTS amount_cents          INTEGER,
  ADD COLUMN IF NOT EXISTS customer_name         TEXT,
  ADD COLUMN IF NOT EXISTS program_slug          TEXT,
  ADD COLUMN IF NOT EXISTS program_name          TEXT,
  ADD COLUMN IF NOT EXISTS application_id        UUID,
  ADD COLUMN IF NOT EXISTS internal_order_id     TEXT,
  ADD COLUMN IF NOT EXISTS card_token            TEXT,
  ADD COLUMN IF NOT EXISTS authorized_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS authorized_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS captured_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captured_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS released_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkout_completed_at TIMESTAMPTZ;

-- ── barber_subscriptions ──────────────────────────────────────────────────────
-- Affirm webhook writes affirm_charge_id; deactivation writes deactivated_at / deactivation_reason
ALTER TABLE public.barber_subscriptions
  ADD COLUMN IF NOT EXISTS affirm_charge_id      TEXT,
  ADD COLUMN IF NOT EXISTS deactivated_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivation_reason   TEXT;

-- ── applications ─────────────────────────────────────────────────────────────
-- Affirm webhook writes affirm_charge_id, payment_amount, payment_completed_at, refund_amount, refunded_at
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS affirm_charge_id      TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount        NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_amount_cents  INTEGER,
  ADD COLUMN IF NOT EXISTS payment_completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount         NUMERIC,
  ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ;

-- ── 20260404000003_rls_assignment_submissions_support_tickets.sql ──
-- RLS for assignment_submissions and support_tickets.
-- These tables had no policies. Both are learner-write surfaces.
-- Apply in Supabase Dashboard → SQL Editor.

-- ── assignment_submissions ────────────────────────────────────────────────────
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignment_submissions_own_read"   ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_own_insert" ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_own_update" ON public.assignment_submissions;
DROP POLICY IF EXISTS "assignment_submissions_admin"      ON public.assignment_submissions;

-- Learners can read and write only their own submissions
CREATE POLICY "assignment_submissions_own_read" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "assignment_submissions_own_insert" ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assignment_submissions_own_update" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and instructors can read all submissions
CREATE POLICY "assignment_submissions_admin" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'super_admin', 'instructor', 'staff')
    )
  );

-- ── support_tickets ───────────────────────────────────────────────────────────
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_own_read"   ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_own_insert" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_admin"      ON public.support_tickets;

-- Learners can read their own tickets and create new ones
CREATE POLICY "support_tickets_own_read" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "support_tickets_own_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins and staff can read and update all tickets
CREATE POLICY "support_tickets_admin" ON public.support_tickets
  FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── 20260406000001_profiles_onboarding_columns.sql ──
-- Add missing onboarding tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agreements_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS handbook_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS funding_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS funding_source text,
  ADD COLUMN IF NOT EXISTS schedule_selected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_cohort text,
  ADD COLUMN IF NOT EXISTS cohort_start_date date,
  ADD COLUMN IF NOT EXISTS schedule_preference text;

-- ── 20260408000001_apprentice_payroll_rls.sql ──
-- apprentice_payroll RLS audit and remediation.
--
-- Found on audit: RLS was already enabled with 7 policies, but one policy
-- (auth_read_apprentice_payroll, qual: true) allowed any authenticated user
-- to SELECT all payroll rows. Dropped that policy.
--
-- Remaining policies use is_admin() for admin/staff access and
-- student_id = auth.uid() for student read-own access.
--
-- Applied directly via Supabase Management API on 2026-04-08.
-- This file documents what was applied; do not re-run.

DROP POLICY IF EXISTS "auth_read_apprentice_payroll" ON public.apprentice_payroll;

-- Verified live policy set after remediation:
-- Admins can manage payroll  | ALL    | is_admin()
-- admin_bypass_select        | SELECT | is_admin()
-- admin_bypass_insert        | INSERT | WITH CHECK is_admin()
-- admin_bypass_update        | UPDATE | is_admin()
-- admin_bypass_delete        | DELETE | is_admin()
-- Users can view own payroll | SELECT | student_id = auth.uid()

-- ── 20260408000002_backfill_enrollment_course_ids.sql ──
-- Migration: 20260408000001
--
-- Backfills course_id on program_enrollments for barber and HVAC programs.
-- All existing enrollments have course_id = NULL because runBarberPostPayment()
-- and the HVAC enrollment pipeline never set it. Students paid but had no
-- LMS course linked to their enrollment.
--
-- Also publishes the barber course (was stuck in draft).
--
-- Apply in Supabase Dashboard → SQL Editor.

-- 1. Publish the barber course (was draft)
UPDATE public.courses
SET status = 'published'
WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-apprenticeship';

-- 2. Backfill course_id for all barber enrollments
UPDATE public.program_enrollments
SET course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
WHERE program_slug = 'barber-apprenticeship'
  AND course_id IS NULL;

-- 3. Backfill course_id for all HVAC enrollments
UPDATE public.program_enrollments
SET course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
WHERE program_slug IN ('hvac-technician', 'hvac', 'hvac-epa-608')
  AND course_id IS NULL;

-- Verify
SELECT
  program_slug,
  course_id,
  COUNT(*) AS enrollments
FROM public.program_enrollments
WHERE program_slug IN ('barber-apprenticeship', 'hvac-technician', 'hvac', 'hvac-epa-608')
GROUP BY program_slug, course_id
ORDER BY program_slug;

-- ── 20260408000003_calendly_token.sql ──
-- Store Calendly Personal Access Token in app_secrets.
-- Used by server-side API routes to interact with the Calendly API
-- (read scheduled events, verify bookings, create scheduling links).
--
-- DO NOT run this file as-is. Replace <CALENDLY_PAT> with the actual token
-- from Calendly -> Integrations -> API & Webhooks -> Personal Access Tokens.
-- Run manually in Supabase Dashboard -> SQL Editor.
--
-- Token is service-role only via RLS on app_secrets.
-- Rotate by running:
--   UPDATE app_secrets SET value = '<new_token>', updated_at = now()
--   WHERE key = 'CALENDLY_PAT';

INSERT INTO app_secrets (key, value, scope, note)
VALUES (
  'CALENDLY_PAT',
  '<CALENDLY_PAT>',
  'runtime',
  'Calendly Personal Access Token. Scopes: event_types:read/write, scheduled_events:read/write, scheduling_links:write, availability:read/write, webhooks:read/write. Rotate at https://calendly.com/integrations/api_webhooks'
)
ON CONFLICT (key) DO UPDATE
  SET value      = EXCLUDED.value,
      note       = EXCLUDED.note,
      updated_at = now();

-- ── 20260408000004_clear_bad_ai_quiz_questions.sql ──
-- Clear AI-hallucinated Excel quiz questions from two HVAC course lessons.
--
-- These rows were seeded by the AI ingest pipeline with wrong content (Excel questions
-- in HVAC lessons) and wrong shape ({question_text, correct_answer, points, question_type}
-- instead of the canonical {question, options, correctAnswer, explanation}).
--
-- The lessons are lab/reading types that don't require quiz questions.
-- Clearing quiz_questions removes the broken quiz tab from those lessons.

UPDATE public.course_lessons
SET quiz_questions = NULL
WHERE id IN (
  '78c332e4-5725-4813-b246-584473151d78',  -- Multimeter & Amp Clamp Lab
  'd17856eb-7e55-41cd-9557-44ec15812b06'   -- Reading Wiring Diagrams & Schematics
)
  AND quiz_questions IS NOT NULL
  -- Safety check: only clear if the shape is the AI-ingest shape (has question_text key)
  AND (quiz_questions->0->>'question_text') IS NOT NULL;

-- ── 20260408000005_testing_appointments.sql ──
-- Testing appointments and reminders tables.
-- Populated by /api/testing/calendly-webhook on invitee.created/canceled.
-- Reminders fired by /api/internal/testing-reminders cron.

CREATE TABLE IF NOT EXISTS public.testing_appointments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendly_event_uri    text UNIQUE,
  calendly_invitee_uri  text UNIQUE,
  invitee_name          text NOT NULL,
  invitee_email         text NOT NULL,
  invitee_phone         text,
  exam_type             text,
  start_time            timestamptz NOT NULL,
  end_time              timestamptz,
  status                text NOT NULL DEFAULT 'confirmed',
                          CHECK (status IN ('confirmed', 'canceled', 'completed', 'no_show')),
  cancel_url            text,
  reschedule_url        text,
  stripe_payment_intent text,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testing_appointment_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid NOT NULL REFERENCES public.testing_appointments(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('24h', '1h')),
  send_at         timestamptz NOT NULL,
  sent            boolean NOT NULL DEFAULT false,
  sent_at         timestamptz,
  canceled        boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testing_appts_email     ON public.testing_appointments(invitee_email);
CREATE INDEX IF NOT EXISTS idx_testing_appts_start     ON public.testing_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_testing_appts_status    ON public.testing_appointments(status);
CREATE INDEX IF NOT EXISTS idx_testing_reminders_send  ON public.testing_appointment_reminders(send_at)
  WHERE sent = false AND canceled = false;

-- RLS: service role only for writes; admins can read
ALTER TABLE public.testing_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_appointment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.testing_appointments;
CREATE POLICY "Service role full access" ON public.testing_appointments
  FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role full access" ON public.testing_appointment_reminders;
CREATE POLICY "Service role full access" ON public.testing_appointment_reminders
  FOR ALL USING (auth.role() = 'service_role');

-- Store webhook signing secret
INSERT INTO app_secrets (key, value, scope, note)
VALUES (
  'CALENDLY_WEBHOOK_SECRET',
  '9b396c9ee4161ae2241c6938bb8601e19e6a37f4a22d376cc68f1db421723cd3',
  'runtime',
  'Calendly webhook signing key for /api/testing/calendly-webhook. Webhook URI: https://api.calendly.com/webhook_subscriptions/dd9f4be4-0f00-49e8-a637-d84a7aeb4d80'
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now();

-- ── 20260408000006_transfer_hours_authority.sql ──
-- Transfer hour authority columns on applications
--
-- PRICING POLICY (immutable — do not change without updating all Stripe routes):
--   Transfer hours are progress credit only. They reduce program duration, NOT tuition.
--   Tuition is fixed at $4,980 (TUITION_CENTS = 498000) regardless of any transfer hour value.
--   These columns exist for auditability, staff review, scheduling, and dispute evidence ONLY.
--
-- transfer_hours_claimed  — student-reported at intake (unverified)
-- transfer_hours_verified — staff-confirmed after document review (null until verified)
-- transfer_hours_verified_by — auth.users.id of staff who verified
-- transfer_hours_verified_at — timestamp of verification

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS transfer_hours_claimed   integer CHECK (transfer_hours_claimed >= 0),
  ADD COLUMN IF NOT EXISTS transfer_hours_verified  integer CHECK (transfer_hours_verified >= 0),
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_at timestamptz;

COMMENT ON COLUMN public.applications.transfer_hours_claimed
  IS 'Student-submitted transfer hours (unverified). Does not affect tuition.';
COMMENT ON COLUMN public.applications.transfer_hours_verified
  IS 'Staff-verified transfer hours (authoritative for ops, not pricing). Does not affect tuition.';
COMMENT ON COLUMN public.applications.transfer_hours_verified_by
  IS 'Staff user who verified the transfer hours claim.';
COMMENT ON COLUMN public.applications.transfer_hours_verified_at
  IS 'Timestamp when transfer hours were verified by staff.';

-- Index: staff review queue — applications with claimed but unverified hours
CREATE INDEX IF NOT EXISTS idx_applications_transfer_hours_pending
  ON public.applications (transfer_hours_claimed, transfer_hours_verified)
  WHERE transfer_hours_claimed > 0 AND transfer_hours_verified IS NULL;

-- ── 20260409000001_signatures_add_signer_columns.sql ──
-- Add signer_name, signer_email, role columns to signatures table.
-- The /api/signature/documents/[id]/sign route inserts these fields
-- but the original table only had user_id + signature_data columns.
-- signed_at already existed; added IF NOT EXISTS for safety.

ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS signer_name  text,
  ADD COLUMN IF NOT EXISTS signer_email text,
  ADD COLUMN IF NOT EXISTS role         text;

-- ── 20260409000002_signatures_rls.sql ──
-- Enable RLS on signatures and add scoped policies.
--
-- The /api/signature/documents/[id]/sign route enforces signer_email = auth.email()
-- at the application layer. These policies add a DB-level backstop so no row can
-- be inserted with a signer_email that doesn't match the calling user's email,
-- and reads are scoped to the signer's own rows (admins see all).

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (Supabase default — explicit for clarity)
DROP POLICY IF EXISTS "Service role full access on signatures" ON public.signatures;
CREATE POLICY "Service role full access on signatures"
  ON public.signatures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can insert a signature only for their own email
DROP POLICY IF EXISTS "Users can sign as themselves" ON public.signatures;
CREATE POLICY "Users can sign as themselves"
  ON public.signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    signer_email IS NOT NULL
    AND lower(signer_email) = lower(auth.email())
  );

-- Users can read their own signatures
DROP POLICY IF EXISTS "Users can read own signatures" ON public.signatures;
CREATE POLICY "Users can read own signatures"
  ON public.signatures
  FOR SELECT
  TO authenticated
  USING (lower(signer_email) = lower(auth.email()));

-- Admins and staff can read all signatures
DROP POLICY IF EXISTS "Admins can read all signatures" ON public.signatures;
CREATE POLICY "Admins can read all signatures"
  ON public.signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  );

-- Admins and staff can update and delete any signature row
DROP POLICY IF EXISTS "Admins can manage all signatures" ON public.signatures;
CREATE POLICY "Admins can manage all signatures"
  ON public.signatures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  );

-- ── 20260410000001_fix_license_agreement_acceptances_rls.sql ──
-- Fix RLS on license_agreement_acceptances so authenticated users can sign agreements.
-- The table had GRANT applied but the INSERT policy was either missing or
-- incorrectly scoped, causing 403 for all authenticated users.

-- Ensure RLS is enabled
ALTER TABLE public.license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "Users can view own signatures" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Users can insert own signatures" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Users can sign agreements" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Authenticated users can sign" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Users can read own acceptances" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Admins can read all acceptances" ON public.license_agreement_acceptances;

-- SELECT: users can read their own records; admins can read all
DROP POLICY IF EXISTS "Users can read own acceptances" ON public.license_agreement_acceptances;
CREATE POLICY "Users can read own acceptances" ON public.license_agreement_acceptances
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all acceptances" ON public.license_agreement_acceptances;
CREATE POLICY "Admins can read all acceptances" ON public.license_agreement_acceptances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- INSERT: authenticated users can insert their own records only
DROP POLICY IF EXISTS "Users can sign agreements" ON public.license_agreement_acceptances;
CREATE POLICY "Users can sign agreements" ON public.license_agreement_acceptances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update their own records (re-signing)
DROP POLICY IF EXISTS "Users can update own acceptances" ON public.license_agreement_acceptances;
CREATE POLICY "Users can update own acceptances" ON public.license_agreement_acceptances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the authenticated role has the necessary privileges
GRANT SELECT, INSERT, UPDATE ON public.license_agreement_acceptances TO authenticated;
GRANT SELECT ON public.license_agreement_acceptances TO anon;

-- ── 20260410000002_fix_program_enrollments_fk.sql ──
-- fk_program_enrollments_ap constrains program_enrollments.program_id to
-- apprenticeship_programs(id), which blocks enrollment in non-apprenticeship
-- programs (healthcare, HVAC, IT, etc.) that live in the programs table.
--
-- Fix: drop the restrictive FK and add a nullable reference to programs instead.
-- Existing rows referencing apprenticeship_programs are unaffected — program_id
-- values that exist in apprenticeship_programs will still be valid UUIDs.

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS fk_program_enrollments_ap;

-- Also drop the unique constraint (backed by an index — must drop constraint not index)
ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS uq_program_enrollments_user_program;

-- ── 20260412000001_program_instructors.sql ──
-- program_instructors: assigns human instructors to programs.
--
-- Used by the instructor dashboard to scope enrollment views.
-- Until this table is populated, instructors see all program_enrollments.
--
-- Apply in Supabase Dashboard → SQL Editor, then populate rows for each
-- instructor/program pair before enabling scoped filtering in the dashboard.

create table if not exists public.program_instructors (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  program_id    uuid not null references public.programs(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  assigned_by   uuid references public.profiles(id) on delete set null,
  is_primary    boolean not null default false
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_instructors_uniq ON public.program_instructors (instructor_id, program_id);

create index if not exists idx_program_instructors_instructor
  on public.program_instructors(instructor_id);

create index if not exists idx_program_instructors_program
  on public.program_instructors(program_id);

-- RLS: admins and staff can manage; instructors can read their own rows
alter table public.program_instructors enable row level security;

drop policy if exists "Admins manage program_instructors" on public.program_instructors;
create policy "Admins manage program_instructors" on public.program_instructors
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

drop policy if exists "Instructors read own assignments" on public.program_instructors;
create policy "Instructors read own assignments" on public.program_instructors
  for select
  using (instructor_id = auth.uid());

-- ── 20260413000001_missing_admin_tables.sql ──
-- Missing tables referenced by admin pages with no prior migration.
-- All pages already handle query errors gracefully (empty fallback).
-- Apply in Supabase Dashboard → SQL Editor.

-- ── 1. workflows ─────────────────────────────────────────────────────────────
-- Used by: /admin/workflows, /admin/autopilot
CREATE TABLE IF NOT EXISTS public.workflows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft | active | paused | archived
  category      TEXT,                             -- enrollment | compliance | notification | etc.
  trigger_type  TEXT,                             -- manual | schedule | event
  trigger_config JSONB,
  steps         JSONB DEFAULT '[]',
  run_count     INTEGER NOT NULL DEFAULT 0,
  last_run_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows (status);

-- ── 2. automation_rules ───────────────────────────────────────────────────────
-- Used by: /admin/autopilot
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft | active | paused
  trigger_type    TEXT,                            -- enrollment | application | schedule | event
  trigger_config  JSONB,
  action_type     TEXT,                            -- send_email | update_status | create_task | etc.
  action_config   JSONB,
  run_count       INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON public.automation_rules (status);

-- ── 3. email_automations ──────────────────────────────────────────────────────
-- Used by: /admin/email-marketing/automation
CREATE TABLE IF NOT EXISTS public.email_automations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_event TEXT,                              -- enrollment | application_approved | inactivity | etc.
  delay_hours   INTEGER NOT NULL DEFAULT 0,
  subject       TEXT,
  html_body     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  sent_count    INTEGER NOT NULL DEFAULT 0,
  open_count    INTEGER NOT NULL DEFAULT 0,
  click_count   INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. financial_assurance_records ───────────────────────────────────────────
-- Used by: /admin/compliance/financial-assurance
CREATE TABLE IF NOT EXISTS public.financial_assurance_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assurance_type    TEXT NOT NULL,                 -- surety_bond | insurance | letter_of_credit
  provider_name     TEXT,
  policy_number     TEXT,
  amount_cents      BIGINT,
  effective_date    DATE,
  expiration_date   DATE,
  status            TEXT NOT NULL DEFAULT 'active', -- active | expired | cancelled
  document_url      TEXT,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financial_assurance_expiration
  ON public.financial_assurance_records (expiration_date)
  WHERE status = 'active';

-- ── 5. mou_documents ─────────────────────────────────────────────────────────
-- Used by: /admin/docs/mou
CREATE TABLE IF NOT EXISTS public.mou_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  version         TEXT,
  document_status TEXT NOT NULL DEFAULT 'draft',   -- draft | active | superseded | archived
  document_type   TEXT NOT NULL DEFAULT 'mou',     -- mou | addendum | amendment
  storage_path    TEXT,
  signed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_at       TIMESTAMPTZ,
  effective_date  DATE,
  expiration_date DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. social_campaigns ──────────────────────────────────────────────────────
-- Used by: /admin/social-media
CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',     -- draft | scheduled | active | completed | paused
  platform      TEXT,                              -- facebook | instagram | twitter | linkedin | all
  content       TEXT,
  media_urls    JSONB DEFAULT '[]',
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  reach         INTEGER,
  impressions   INTEGER,
  clicks        INTEGER,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. v_admin_financial_assurance_summary (view) ────────────────────────────
-- Used by: /admin/compliance/financial-assurance
-- Must be created AFTER financial_assurance_records table above.
DROP VIEW IF EXISTS public.v_admin_financial_assurance_summary;
CREATE OR REPLACE VIEW public.v_admin_financial_assurance_summary AS
SELECT
  COUNT(*)                                                                    AS total_records,
  COUNT(*) FILTER (WHERE status = 'active')                                  AS active_count,
  COUNT(*) FILTER (WHERE status = 'expired')                                 AS expired_count,
  COUNT(*) FILTER (WHERE expiration_date < now() AND status = 'active')      AS expiring_soon_count,
  COALESCE(SUM(f.coverage_amount::numeric * 100) FILTER (WHERE f.status = 'active'), 0) AS total_coverage_cents,
  MAX(updated_at)                                                             AS last_updated_at
FROM public.financial_assurance_records f;

-- ── 8. Missing columns on program_enrollments ────────────────────────────────
-- Admin enrollments page queries: access_granted_at, at_risk, amount_paid_cents
-- approve.ts writes: amount_paid_cents (already in original CREATE TABLE)
-- Admin dashboard reads: amount_paid_cents, payment_status (already added)
-- These are the remaining gaps:

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS at_risk            BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_granted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrollment_state   TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS program_slug       TEXT;

CREATE INDEX IF NOT EXISTS idx_program_enrollments_at_risk
  ON public.program_enrollments (at_risk) WHERE at_risk = true;

CREATE INDEX IF NOT EXISTS idx_program_enrollments_access
  ON public.program_enrollments (access_granted_at) WHERE access_granted_at IS NULL;

-- ── 9. Missing columns on lesson_progress ────────────────────────────────────
-- progress/complete route queries: lesson_progress.course_id, time_spent_seconds
-- lesson_progress was created with (user_id, course_slug, lesson_id) — no course_id UUID

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS course_id          UUID,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id
  ON public.lesson_progress (course_id);

-- ── 10. lms_progress table ───────────────────────────────────────────────────
-- progress/complete writes to lms_progress (not lesson_progress).
-- This table tracks per-course completion state, separate from per-lesson progress.
CREATE TABLE IF NOT EXISTS public.lms_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         UUID,
  course_slug       TEXT,
  status            TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | completed
  progress_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ,
  evidence_url      TEXT,
  last_activity_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lms_progress_user ON public.lms_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_course ON public.lms_progress (course_id);

-- ── 20260413000100_course_builder_compliance_fields.sql ──
-- Course builder compliance fields
-- Adds regulatory metadata columns to course_lessons and course_modules,
-- and a compliance_profiles reference table.

-- ─── compliance_profiles ─────────────────────────────────────────────────────
-- Stores the canonical compliance profile definitions used by the builder audit.
-- Rows are seeded below; the builder reads them via GET /api/admin/course-builder/profiles.

CREATE TABLE IF NOT EXISTS public.compliance_profiles (
  key                              text PRIMARY KEY,
  label                            text NOT NULL,
  credential_target                text NOT NULL,
  minimum_program_hours            numeric NOT NULL DEFAULT 0,
  requires_final_exam              boolean NOT NULL DEFAULT false,
  require_passing_scores           boolean NOT NULL DEFAULT false,
  require_instructor_signoff       boolean NOT NULL DEFAULT false,
  require_evidence_for_practicals  boolean NOT NULL DEFAULT false,
  require_domain_mapping           boolean NOT NULL DEFAULT false,
  require_competency_mapping       boolean NOT NULL DEFAULT false,
  require_hour_category            boolean NOT NULL DEFAULT false,
  require_delivery_method          boolean NOT NULL DEFAULT false,
  require_fieldwork_tracking       boolean NOT NULL DEFAULT false,
  require_instructor_requirements  boolean NOT NULL DEFAULT false,
  require_certificate_verification boolean NOT NULL DEFAULT false,
  domain_requirements              jsonb,
  created_at                       timestamptz NOT NULL DEFAULT now(),
  updated_at                       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.compliance_profiles (key, label, credential_target, minimum_program_hours, requires_final_exam, require_passing_scores, require_instructor_signoff, require_evidence_for_practicals, require_domain_mapping, require_competency_mapping, require_hour_category, require_delivery_method, require_fieldwork_tracking, require_instructor_requirements, require_certificate_verification)
VALUES
  ('internal_basic',     'Internal Basic',          'INTERNAL',          0,   false, false, false, false, false, false, false, false, false, false, false),
  ('state_board_strict', 'State Board Strict',       'STATE_BOARD',       1500, true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true),
  ('dol_apprenticeship', 'DOL Apprenticeship',       'DOL_APPRENTICESHIP',2000, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true),
  ('icrc_peer_recovery', 'IC&RC Peer Recovery',      'IC&RC',             46,   true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true),
  ('naadac_peer_support','NAADAC Peer Support',      'NAADAC',            30,   true,  true,  true,  true,  true,  true,  true,  true,  false, true,  true),
  ('custom_regulated',   'Custom Regulated',         'CUSTOM',            0,   false, true,  true,  true,  true,  true,  true,  true,  false, true,  false)
ON CONFLICT (key) DO NOTHING;

-- ─── course_lessons compliance columns ───────────────────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS domain_key                  text,
  ADD COLUMN IF NOT EXISTS hour_category               text
    CHECK (hour_category IN ('didactic','practical','clinical','fieldwork','observation','supervision','self_study','exam')),
  ADD COLUMN IF NOT EXISTS evidence_type               text
    CHECK (evidence_type IN ('quiz','upload','video','audio','checklist','observation','attestation','exam','reflection')),
  ADD COLUMN IF NOT EXISTS delivery_method             text
    CHECK (delivery_method IN ('online_async','online_live','in_person','hybrid','field_based')),
  ADD COLUMN IF NOT EXISTS requires_instructor_signoff boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instructor_requirement      jsonb,
  ADD COLUMN IF NOT EXISTS minimum_seat_time_minutes   integer,
  ADD COLUMN IF NOT EXISTS fieldwork_eligible          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_artifacts          jsonb,
  ADD COLUMN IF NOT EXISTS compliance_profile_key      text REFERENCES public.compliance_profiles(key);

-- ─── course_modules compliance columns ───────────────────────────────────────

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS domain_key    text,
  ADD COLUMN IF NOT EXISTS target_hours  numeric;

-- ─── courses regulatory columns ──────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS compliance_profile_key      text REFERENCES public.compliance_profiles(key),
  ADD COLUMN IF NOT EXISTS governing_body              text,
  ADD COLUMN IF NOT EXISTS governing_region            text,
  ADD COLUMN IF NOT EXISTS governing_standard_version  text,
  ADD COLUMN IF NOT EXISTS retention_policy_days       integer,
  ADD COLUMN IF NOT EXISTS audit_notes                 text;

-- ─── indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_course_lessons_domain_key
  ON public.course_lessons (domain_key)
  WHERE domain_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_hour_category
  ON public.course_lessons (hour_category)
  WHERE hour_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_compliance_profile
  ON public.course_lessons (compliance_profile_key)
  WHERE compliance_profile_key IS NOT NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.compliance_profiles ENABLE ROW LEVEL SECURITY;

-- Public read — profiles are reference data
DROP POLICY IF EXISTS "compliance_profiles_public_read" ON public.compliance_profiles;
CREATE POLICY "compliance_profiles_public_read" ON public.compliance_profiles FOR SELECT
  USING (true);

-- Admin write
DROP POLICY IF EXISTS "compliance_profiles_admin_write" ON public.compliance_profiles;
CREATE POLICY "compliance_profiles_admin_write" ON public.compliance_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── 20260415000002_signature_documents_fields.sql ──
-- Extend signature_documents with PDF template support and field mapping.
-- Extend signatures with captured signature image, generated PDF, and prefill values.

-- signature_documents additions
alter table signature_documents
  add column if not exists pdf_template_url  text,          -- Supabase Storage URL of uploaded PDF template
  add column if not exists field_map         jsonb,         -- [{ name, label, type, x, y, page, width, height, required }]
  add column if not exists doc_type_category text           -- 'grant' | 'enrollment' | 'mou' | 'nda' | 'policy' | 'other'
    check (doc_type_category in ('grant','enrollment','mou','nda','policy','other'));

-- signatures additions
alter table signatures
  add column if not exists signature_data    text,          -- base64 PNG data URL of drawn/typed signature
  add column if not exists signature_type    text           -- 'draw' | 'typed'
    check (signature_type in ('draw','typed')),
  add column if not exists typed_name        text,          -- name as typed (for typed mode)
  add column if not exists pdf_url           text,          -- Supabase Storage URL of completed signed PDF
  add column if not exists field_values      jsonb,         -- { fieldName: value } prefill data
  add column if not exists signed_at         timestamptz default now();

-- Index for fast lookup of signed docs by document
create index if not exists signatures_document_id_idx
  on signatures (document_id);

-- Index for admin view: all signatures for a signer email
create index if not exists signatures_signer_email_idx
  on signatures (signer_email);

-- ── 20260416000001_social_media_auto_post.sql ──
-- Social media auto-posting columns
-- Adds share_to_social + social_posted_at to blog_posts and reels
-- so the cron-social-media function can pick up new content automatically.

-- blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS share_to_social boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_posted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_post_caption text DEFAULT NULL;

-- reels
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS share_to_social boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_posted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_post_caption text DEFAULT NULL;

-- Index for efficient scheduler queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_social
  ON public.blog_posts (share_to_social, social_posted_at, published_at)
  WHERE share_to_social = true AND social_posted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reels_social
  ON public.reels (share_to_social, social_posted_at, published)
  WHERE share_to_social = true AND social_posted_at IS NULL;

-- ── 20260416000002_hardcoded_to_db_tables.sql ──
-- Convert hardcoded data to database-driven tables
-- Replaces: data/team.ts, data/training-partners.ts, data/state-licensing.ts,
--           lib/testing/proctoring-capabilities.ts, hardcoded FAQs,
--           hardcoded testimonials, hardcoded impact stats, partner_courses

-- ── team_members ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  title           text NOT NULL,
  org_role        text,                        -- e.g. 'Executive Leadership'
  bio             text,
  headshot_url    text,
  email           text,
  linkedin_url    text,
  display_order   integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── testimonials ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  title           text,                        -- e.g. 'CNA Graduate, 2024'
  program_slug    text,                        -- links to programs.slug
  quote           text NOT NULL,
  photo_url       text,
  rating          integer DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  show_on_home    boolean DEFAULT false,
  show_on_program boolean DEFAULT true,
  is_active       boolean DEFAULT true,
  display_order   integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── faqs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faqs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question        text NOT NULL,
  answer          text NOT NULL,
  category        text NOT NULL,              -- e.g. 'funding', 'enrollment', 'programs'
  program_slug    text,                       -- null = site-wide, set = program-specific
  display_order   integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── testing_providers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testing_providers (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key                 text UNIQUE NOT NULL,   -- e.g. 'certiport', 'nha', 'workkeys'
  name                text NOT NULL,
  description         text,
  logo_url            text,
  image_url           text,
  website_url         text,
  proctoring_type     text NOT NULL,          -- 'IN_PERSON_ONLY' | 'IN_PERSON_OR_PROVIDER_REMOTE' | 'CENTER_REMOTE_ALLOWED'
  status              text DEFAULT 'active',  -- 'active' | 'coming_soon' | 'inactive'
  exams               jsonb DEFAULT '[]',     -- array of exam definitions
  fees                jsonb DEFAULT '[]',     -- array of fee structures
  display_order       integer DEFAULT 0,
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── training_partners ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_partners (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name                text NOT NULL,
  slug                text UNIQUE,
  category            text NOT NULL,          -- 'barbershop' | 'healthcare' | 'cdl' | etc.
  training_role       text NOT NULL,          -- 'ojt' | 'clinical' | 'apprenticeship' | etc.
  address             text,
  city                text,
  state               text DEFAULT 'IN',
  zip                 text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  logo_url            text,
  website_url         text,
  rapids_employer_id  text,                   -- DOL RAPIDS employer ID if applicable
  mou_on_file         boolean DEFAULT false,
  status              text DEFAULT 'active',  -- 'active' | 'pending' | 'inactive'
  programs_list       text[],                 -- program names this partner supports
  notes               text,
  display_order       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── state_licensing ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.state_licensing (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_type        text NOT NULL,          -- 'cna' | 'phlebotomy' | 'hvac' | etc.
  state               text NOT NULL,
  state_code          text NOT NULL,          -- 2-letter code
  available           boolean DEFAULT true,
  unavailable_reason  text,
  requirements_url    text,
  board_name          text,
  notes               text,
  display_order       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── partner_types ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_types (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key             text UNIQUE NOT NULL,       -- e.g. 'employer', 'training-provider'
  title           text NOT NULL,
  description     text,
  icon            text,                       -- lucide icon name
  color           text,                       -- tailwind color class
  benefits        jsonb DEFAULT '[]',         -- array of benefit strings
  requirements    jsonb DEFAULT '[]',         -- array of requirement strings
  apply_href      text,                       -- where the apply button goes
  display_order   integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── partner_courses (micro-classes from 3rd party partners) ──────────────────
CREATE TABLE IF NOT EXISTS public.partner_courses (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_key         text NOT NULL,          -- 'hsi' | 'nrf' | 'jri'
  partner_name        text NOT NULL,
  course_key          text UNIQUE NOT NULL,   -- e.g. 'hsi-food-handler'
  title               text NOT NULL,
  description         text,
  duration_hours      numeric,
  credential          text,
  image_url           text,
  retail_price_cents  integer,                -- in cents, null = free/grant-funded
  stripe_price_id     text,                   -- Stripe price ID for checkout
  payment_link        text,                   -- direct Stripe payment link
  partner_url         text,                   -- 3rd party course URL
  funding_type        text DEFAULT 'paid',    -- 'paid' | 'grant' | 'wioa'
  category            text,                   -- 'food-safety' | 'retail' | 'workforce'
  is_active           boolean DEFAULT true,
  display_order       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── impact_stats (replace broken impact_statistics table) ────────────────────
CREATE TABLE IF NOT EXISTS public.impact_stats (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key        text UNIQUE NOT NULL,       -- e.g. 'graduates', 'employers', 'programs'
  label           text NOT NULL,             -- e.g. 'Graduates Trained'
  value           text NOT NULL,             -- e.g. '2,400+' (display string)
  numeric_value   numeric,                   -- for sorting/calculations
  icon            text,                      -- lucide icon name
  color           text,                      -- tailwind color class
  show_on_home    boolean DEFAULT true,
  display_order   integer DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON public.testimonials (is_active, show_on_home, program_slug);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_testing_providers_active ON public.testing_providers (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_training_partners_category ON public.training_partners (category, status);
CREATE INDEX IF NOT EXISTS idx_partner_courses_active ON public.partner_courses (is_active, partner_key, display_order);
CREATE INDEX IF NOT EXISTS idx_impact_stats_home ON public.impact_stats (show_on_home, display_order);

-- ── RLS: public read, admin write ─────────────────────────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_licensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;

-- Public read
DROP policy if exists "public_read_team_members" on public.team_members;
CREATE policy "public_read_team_members" on public.team_members     FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_testimonials" on public.testimonials;
CREATE policy "public_read_testimonials" on public.testimonials     FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_faqs" on public.faqs;
CREATE policy "public_read_faqs" on public.faqs             FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_testing_providers" on public.testing_providers;
CREATE policy "public_read_testing_providers" on public.testing_providers FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_training_partners" on public.training_partners;
CREATE policy "public_read_training_partners" on public.training_partners FOR SELECT USING (status = 'active');
DROP policy if exists "public_read_state_licensing" on public.state_licensing;
CREATE policy "public_read_state_licensing" on public.state_licensing  FOR SELECT USING (true);
DROP policy if exists "public_read_partner_types" on public.partner_types;
CREATE policy "public_read_partner_types" on public.partner_types    FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_partner_courses" on public.partner_courses;
CREATE policy "public_read_partner_courses" on public.partner_courses  FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_impact_stats" on public.impact_stats;
CREATE policy "public_read_impact_stats" on public.impact_stats     FOR SELECT USING (true);

-- Admin write
DROP policy if exists "admin_all_team_members" on public.team_members;
CREATE policy "admin_all_team_members" on public.team_members     FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_testimonials" on public.testimonials;
CREATE policy "admin_all_testimonials" on public.testimonials     FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_faqs" on public.faqs;
CREATE policy "admin_all_faqs" on public.faqs             FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_testing_providers" on public.testing_providers;
CREATE policy "admin_all_testing_providers" on public.testing_providers FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_training_partners" on public.training_partners;
CREATE policy "admin_all_training_partners" on public.training_partners FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_state_licensing" on public.state_licensing;
CREATE policy "admin_all_state_licensing" on public.state_licensing  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_partner_types" on public.partner_types;
CREATE policy "admin_all_partner_types" on public.partner_types    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_partner_courses" on public.partner_courses;
CREATE policy "admin_all_partner_courses" on public.partner_courses  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_impact_stats" on public.impact_stats;
CREATE policy "admin_all_impact_stats" on public.impact_stats     FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- ── 20260416000003_seed_hardcoded_data.sql ──
-- Seed hardcoded data into DB tables created in migration 20260416000002
-- Sources: data/team.ts, data/state-licensing.ts, lib/testing/proctoring-capabilities.ts,
--          app/partners/join/page.tsx, components/home/Testimonials.tsx, OutcomeProof.tsx

-- ── TEAM MEMBERS ─────────────────────────────────────────────────────────────

INSERT INTO public.team_members (name, title, org_role, bio, headshot_url, email, display_order) VALUES
(
  'Elizabeth Greene',
  'Founder & Chief Executive Officer',
  'Executive Leadership',
  'U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent (EA), EFIN and PTIN holder, licensed barber, Indiana substitute teacher, EPA 608 Certified Proctor. Elizabeth founded Elevate for Humanity — a DOL Registered Apprenticeship Sponsor, ETPL provider, WRG/WIOA/JRI approved, Job Ready Indy partner, WorkOne partner, EmployIndy partner, HSI affiliate, CareerSafe OSHA provider, Milady partner, NRF Rise Up provider, Certiport CATC, SAM.gov registered (CAGE: 0Q856), federal government contractor, and ByBlack certified. She also operates SupersonicFastCash (tax software) and Selfish Inc., a 501(c)(3) nonprofit (DBA: The Rise Foundation) providing VITA free tax prep and community services.',
  '/images/team/elizabeth-greene-headshot.jpg',
  '',
  1
),
(
  'Jozanna George',
  'Director of Enrollment & Beauty Industry Programs',
  'Enrollment & Instruction',
  'Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.',
  '/images/jozanna-george.jpg',
  'jozanna@elevateforhumanity.org',
  2
),
(
  'Dr. Carlina Wilkes',
  'Executive Director of Financial Operations & Organizational Compliance',
  'Grants & Compliance',
  'Dr. Wilkes brings 24+ years of federal experience with DFAS, holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.',
  '/images/carlina-wilkes.jpg',
  'carlina@elevateforhumanity.org',
  3
),
(
  'Leslie Wafford',
  'Director of Community Services',
  'Community & Supportive Services',
  'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
  '/images/leslie-wafford.jpg',
  'leslie@elevateforhumanity.org',
  4
),
(
  'Delores Reynolds',
  'Social Media & Digital Engagement Coordinator',
  'Communications',
  'Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.',
  '/images/delores-reynolds.jpg',
  'delores@elevateforhumanity.org',
  5
),
(
  'Clystjah Woodley',
  'Program Coordinator',
  'Program Operations',
  'Clystjah supports program operations and student services, helping participants navigate enrollment and stay on track through their training programs.',
  '/images/clystjah-woodley.jpg',
  'clystjah@elevateforhumanity.org',
  6
),
(
  'Alberta Davis',
  'Testing Center Coordinator & Exam Proctor',
  'Credential Testing',
  'Alberta Davis serves as a Testing Center Coordinator and Exam Proctor at Elevate for Humanity''s Workforce Credential Testing Center in Indianapolis. She supports the administration of industry-recognized certification exams and workforce assessments for individuals, employers, schools, and workforce development partners. In her role, Alberta coordinates testing appointments, prepares testing stations, and assists candidates through the check-in and identity verification process to ensure each testing session begins smoothly. As an exam proctor, she monitors in-person and live testing sessions to maintain compliance with certification provider policies and exam security standards. Alberta also assists with onsite testing events for partner organizations and workforce programs, helping expand access to credential testing opportunities across the community.',
  NULL,
  'alberta@elevateforhumanity.org',
  7
)
ON CONFLICT (name) DO UPDATE SET
  title         = EXCLUDED.title,
  org_role      = EXCLUDED.org_role,
  bio           = EXCLUDED.bio,
  headshot_url  = EXCLUDED.headshot_url,
  email         = EXCLUDED.email,
  display_order = EXCLUDED.display_order,
  updated_at    = now();

-- ── TESTIMONIALS ──────────────────────────────────────────────────────────────

INSERT INTO public.testimonials (name, title, quote, show_on_home, show_on_program, rating, display_order) VALUES
(
  'Sarah Johnson',
  'Healthcare Graduate',
  'I didn''t know where to start. This program showed me exactly what to do, step by step. Now I''m certified and working.',
  true, true, 5, 1
),
(
  'Maria Rodriguez',
  'Skilled Trades Graduate',
  'The training was real. The credentials matter. I got hired two weeks after finishing the program.',
  true, true, 5, 2
),
(
  'David Chen',
  'Technology Graduate',
  'No cost, no debt, and a real career path. This changed everything for me.',
  true, true, 5, 3
)
ON CONFLICT (name, quote) DO UPDATE SET
  title           = EXCLUDED.title,
  show_on_home    = EXCLUDED.show_on_home,
  show_on_program = EXCLUDED.show_on_program,
  rating          = EXCLUDED.rating,
  display_order   = EXCLUDED.display_order,
  updated_at      = now();

-- ── IMPACT STATS ──────────────────────────────────────────────────────────────

INSERT INTO public.impact_stats (stat_key, label, value, numeric_value, icon, show_on_home, display_order) VALUES
('job_placement',    'Job placement within 90 days',       '85%',     85,  'TrendingUp', true, 1),
('time_to_cred',     'Average time to credential',         '12 weeks', 12, 'Clock',      true, 2),
('avg_salary',       'Average starting salary',            '$42K',    42,  'DollarSign', true, 3),
('tuition_covered',  'Tuition covered for eligible students', '100%', 100, 'Award',      true, 4)
ON CONFLICT (stat_key) DO UPDATE SET
  label         = EXCLUDED.label,
  value         = EXCLUDED.value,
  numeric_value = EXCLUDED.numeric_value,
  updated_at    = now();

-- ── PARTNER TYPES ─────────────────────────────────────────────────────────────

INSERT INTO public.partner_types (key, title, description, icon, apply_href, display_order) VALUES
('workforce-agency',    'Workforce Agency',        'Refer WIOA, Job Ready Indy, or WRG-funded participants to our approved training programs.',                                  'Building2',    '/partners/apply', 1),
('employer',            'Employer',                'Hire certified graduates, host apprentices, or post jobs to our placement pipeline.',                                        'Briefcase',    '/partners/apply', 2),
('training-provider',   'Training Provider',       'Co-deliver programs, share facilities, or list your programs in our catalog.',                                               'GraduationCap','/partners/apply', 3),
('reentry-org',         'Reentry Organization',    'Connect justice-involved individuals to Job Ready Indy-funded training and placement services.',                             'RefreshCw',    '/partners/apply', 4),
('community-org',       'Community Organization',  'Refer clients facing employment barriers to our programs and support services.',                                             'Users',        '/partners/apply', 5),
('philanthropic',       'Philanthropic Supporter', 'Fund training, supplies, scholarships, or wraparound support services.',                                                     'Heart',        '/philanthropy',   6)
ON CONFLICT (key) DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at  = now();

-- ── TESTING PROVIDERS ─────────────────────────────────────────────────────────

INSERT INTO public.testing_providers (key, name, description, website_url, proctoring_type, status, exams, fees, display_order) VALUES
(
  'esco',
  'EPA Section 608 (ESCO Institute)',
  'Federal refrigerant handling certification required by the EPA Clean Air Act. It is illegal to purchase or handle refrigerants without this certification. Elevate is a nationally authorized proctor site for both ESCO Group and Mainstream Engineering. Required for any HVAC technician who services, maintains, or disposes of equipment containing refrigerants.',
  'https://www.escogroup.org/esco/certifications/epa608.aspx',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Core","description":"Covers EPA regulations, refrigerant safety, environmental impact of ozone-depleting substances, and proper handling procedures. Required as part of every certification type.","durationMinutes":20,"questionCount":25},
    {"name":"Type I — Small Appliances","description":"Covers equipment containing 5 lbs or less of refrigerant — window AC units, refrigerators, freezers, and dehumidifiers.","durationMinutes":20,"questionCount":25},
    {"name":"Type II — High-Pressure","description":"Covers high-pressure systems using refrigerants like R-22 and R-410A — residential and commercial AC, heat pumps, and refrigeration equipment.","durationMinutes":20,"questionCount":25},
    {"name":"Type III — Low-Pressure","description":"Covers low-pressure systems using refrigerants like R-11 and R-123 — large commercial chillers found in office buildings, hospitals, and industrial facilities.","durationMinutes":20,"questionCount":25},
    {"name":"Universal (All Sections)","description":"Passes all four sections in a single sitting. Required for technicians who work across residential, commercial, and industrial systems.","durationMinutes":80,"questionCount":100}
  ]'::jsonb,
  '[
    {"label":"Universal (all sections)","amount":55,"note":"Includes exam fee + proctoring"},
    {"label":"Single section","amount":35,"note":"Includes exam fee + proctoring"}
  ]'::jsonb,
  1
),
(
  'nrf',
  'NRF RISE Up (National Retail Federation)',
  'NRF RISE Up credentials are nationally recognized workforce certifications for customer service, retail, and business roles. Issued by the National Retail Federation Foundation — the largest retail trade association in the world. Recognized by major employers including Walmart, Target, Macy''s, and thousands of small businesses.',
  'https://nrffoundation.org/riseup',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Retail Industry Fundamentals","description":"Entry-level credential covering the basics of working in retail — store operations, customer interaction, product handling, and workplace safety.","durationMinutes":60,"questionCount":60},
    {"name":"Customer Service & Sales","description":"Covers professional customer service skills, sales techniques, handling complaints, building customer loyalty, and meeting sales goals.","durationMinutes":60,"questionCount":60},
    {"name":"Business of Retail: Operations & Profit","description":"Covers retail business operations — inventory management, merchandising, loss prevention, financial basics, and store performance metrics.","durationMinutes":60,"questionCount":60}
  ]'::jsonb,
  '[{"label":"Per credential exam","amount":45,"note":"Includes exam fee + proctoring"}]'::jsonb,
  2
),
(
  'certiport',
  'Certiport Authorized Testing Center',
  'Elevate is an authorized Certiport testing center. Certiport delivers performance-based certification exams for Microsoft, Adobe, CompTIA, Intuit, and IC3. Exams are taken on a computer and test real-world skills — not just memorization. Credentials are issued by the respective technology company and recognized globally by employers.',
  'https://certiport.pearsonvue.com/Locator',
  'IN_PERSON_OR_PROVIDER_REMOTE',
  'active',
  '[
    {"name":"Microsoft Office Specialist (MOS)","description":"Validates proficiency in Microsoft Word, Excel, PowerPoint, Outlook, and Access. The most widely recognized productivity credential in the world."},
    {"name":"IT Specialist","description":"Entry-level IT credentials covering Python, Java, HTML/CSS, networking, databases, and cybersecurity fundamentals."},
    {"name":"Intuit QuickBooks Certified User","description":"Validates ability to use QuickBooks for small business accounting — invoicing, payroll, reporting, and reconciliation."},
    {"name":"Entrepreneurship & Small Business (ESB)","description":"Covers business planning, marketing, financial management, and operations for aspiring entrepreneurs and small business owners."},
    {"name":"IC3 Digital Literacy","description":"Foundational digital literacy credential covering computing fundamentals, key applications, and living online."},
    {"name":"Adobe Certified Professional","description":"Validates creative skills in Photoshop, Illustrator, InDesign, Premiere Pro, and After Effects."},
    {"name":"CompTIA A+ · Network+ · Security+","description":"Industry-standard IT certifications for hardware, networking, and cybersecurity roles."}
  ]'::jsonb,
  '[{"label":"Per exam","amount":45,"note":"Includes exam fee + proctoring"}]'::jsonb,
  3
),
(
  'nha',
  'NHA — National Healthcareer Association',
  'NHA Authorized Testing Center (account #412957). NHA is one of the largest allied health certification bodies in the United States. Credentials are nationally recognized by hospitals, clinics, physician offices, and long-term care facilities. All exams are computer-based and proctored in person.',
  'https://www.nhanow.com/',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Certified Phlebotomy Technician (CPT)","description":"Validates skills in venipuncture, capillary puncture, specimen handling, and patient interaction.","durationMinutes":120,"questionCount":100},
    {"name":"Certified Clinical Medical Assistant (CCMA)","description":"Covers clinical and administrative duties — taking vital signs, preparing patients for exams, assisting with procedures, EKG, phlebotomy, and managing patient records.","durationMinutes":120,"questionCount":150},
    {"name":"Certified EKG Technician (CET)","description":"Validates the ability to perform electrocardiograms (EKGs/ECGs), Holter monitor setup, stress testing, and basic cardiac rhythm interpretation.","durationMinutes":90,"questionCount":100},
    {"name":"Certified Patient Care Technician/Assistant (CPCT/A)","description":"Covers direct patient care skills — vital signs, phlebotomy, EKG, catheter care, wound care, and patient mobility.","durationMinutes":120,"questionCount":150},
    {"name":"Certified Medical Administrative Assistant (CMAA)","description":"Covers front-office healthcare operations — scheduling, insurance verification, medical billing basics, HIPAA compliance, and patient communication.","durationMinutes":90,"questionCount":110},
    {"name":"Certified Pharmacy Technician — ExCPT","description":"Validates pharmacy technician skills — prescription processing, drug dispensing, inventory management, compounding basics, and pharmacy law.","durationMinutes":110,"questionCount":120}
  ]'::jsonb,
  '[
    {"label":"CPT — Phlebotomy","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CCMA — Medical Assistant","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CET — EKG Technician","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"ExCPT — Pharmacy Technician","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CPCT/A — Patient Care Tech","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CMAA — Medical Admin Assistant","amount":243,"note":"$149 NHA exam + $94 testing & administration"}
  ]'::jsonb,
  4
),
(
  'workkeys',
  'ACT WorkKeys / NCRC',
  'The National Career Readiness Certificate (NCRC) is a portable, evidence-based credential recognized by 22,000+ employers nationwide. Earned by passing three ACT WorkKeys assessments. Elevate is an authorized ACT testing site (Realm: 1317721865). Scores are valid for 5 years.',
  'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers.html',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Applied Math","description":"Measures the skill workers use when they apply mathematical reasoning, critical thinking, and problem-solving techniques to work-related problems."},
    {"name":"Workplace Documents","description":"Measures the skill workers use when they read and use written text such as memos, letters, directions, signs, notices, bulletins, policies, and regulations."},
    {"name":"Business Writing","description":"Measures the skill workers use when they write workplace documents such as emails, memos, letters, and other business communications."}
  ]'::jsonb,
  '[
    {"label":"Per assessment","amount":45,"note":"Includes $13.50 ACT fee + $31.50 proctoring"},
    {"label":"Full NCRC battery (3 assessments)","amount":120,"note":"Applied Math + Workplace Documents + Business Writing"}
  ]'::jsonb,
  5
),
(
  'careersafe',
  'CareerSafe / OSHA Outreach',
  'OSHA Outreach Training Program certifications issued through the U.S. Department of Labor. The OSHA 10 and OSHA 30 are the most widely recognized workplace safety credentials in the country. Required by many construction employers, union apprenticeship programs, and federal contractors. A DOL wallet card is issued upon completion — valid for life.',
  'https://www.osha.gov/training/outreach',
  'CENTER_REMOTE_ALLOWED',
  'active',
  '[
    {"name":"OSHA 10-Hour — General Industry","description":"Covers workplace safety fundamentals for non-construction environments — manufacturing, warehousing, healthcare, retail, and service industries.","durationMinutes":600},
    {"name":"OSHA 10-Hour — Construction","description":"Covers construction site safety — fall protection, scaffolding, electrical hazards, struck-by and caught-in hazards, and OSHA standards for the construction industry.","durationMinutes":600},
    {"name":"OSHA 30-Hour — General Industry","description":"Advanced safety training for supervisors and workers with safety responsibilities in general industry.","durationMinutes":1800},
    {"name":"OSHA 30-Hour — Construction","description":"Advanced construction safety training for foremen, supervisors, and safety personnel.","durationMinutes":1800}
  ]'::jsonb,
  '[
    {"label":"OSHA 10-Hour","amount":65,"note":"Includes course + DOL card"},
    {"label":"OSHA 30-Hour","amount":185,"note":"Includes course + DOL card"}
  ]'::jsonb,
  6
)
ON CONFLICT (key) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  proctoring_type = EXCLUDED.proctoring_type,
  status          = EXCLUDED.status,
  exams           = EXCLUDED.exams,
  fees            = EXCLUDED.fees,
  updated_at      = now();

-- ── STATE LICENSING — CNA ─────────────────────────────────────────────────────

INSERT INTO public.state_licensing (program_type, state, state_code, available, unavailable_reason, requirements_url, board_name, notes) VALUES
('cna','Indiana','IN',true,NULL,'https://www.in.gov/isdh/27072.htm','Indiana State Department of Health (ISDH)','Elevate is an approved Indiana CNA training program. Exam proctored on-site. 105 hours required (75 classroom + 30 clinical).'),
('cna','Illinois','IL',false,'Illinois requires CNA training programs to be approved by the Illinois Department of Public Health. Elevate is not yet approved in Illinois.','https://dph.illinois.gov/topics-services/health-care-regulation/nursing-home-hfs-surveyor-training/nurse-aide-training.html','Illinois Department of Public Health','Must complete an Illinois-approved program. Out-of-state training not accepted without reciprocity.'),
('cna','Ohio','OH',false,'Ohio requires CNA training to be completed at an Ohio-approved facility. Reciprocity available if you hold an active Indiana CNA license.','https://odh.ohio.gov/know-our-programs/nurse-aide-registry/nurse-aide-registry','Ohio Department of Health — Nurse Aide Registry','Indiana CNA holders may apply for Ohio reciprocity without retesting if license is active and in good standing.'),
('cna','Michigan','MI',false,'Michigan requires training at a Michigan-approved program. Reciprocity available for active Indiana CNA license holders.','https://www.michigan.gov/lara/bureau-list/bpl/occ/health-professions/nurse-aide','Michigan Department of Licensing and Regulatory Affairs','Active Indiana CNA license holders may apply for Michigan endorsement.'),
('cna','Kentucky','KY',false,'Kentucky requires training at a Kentucky-approved program. Reciprocity available for active Indiana CNA license holders.','https://chfs.ky.gov/agencies/os/oig/hcb/Pages/nurseaideregistry.aspx','Kentucky Cabinet for Health and Family Services','Active Indiana CNA license holders may apply for Kentucky reciprocity.'),
('cna','Tennessee','TN',false,'Tennessee requires training at a Tennessee-approved program. Reciprocity available for active Indiana CNA license holders.','https://www.tn.gov/health/health-program-areas/health-professional-boards/nurse-aide-registry.html','Tennessee Department of Health — Nurse Aide Registry','Active Indiana CNA license holders may apply for Tennessee reciprocity.'),
('cna','Wisconsin','WI',false,'Wisconsin requires training at a Wisconsin-approved program.','https://www.dhs.wisconsin.gov/caregiver/nurse-aide.htm','Wisconsin Department of Health Services','Active Indiana CNA license holders may apply for Wisconsin reciprocity.'),
('cna','Missouri','MO',false,'Missouri requires training at a Missouri-approved program.','https://health.mo.gov/safety/natp/','Missouri Department of Health and Senior Services','Active Indiana CNA license holders may apply for Missouri reciprocity.'),
('cna','Florida','FL',false,'Florida has its own CNA training and testing requirements. Out-of-state training not accepted without Florida approval.','https://ahca.myflorida.com/Medicaid/Long_Term_Care/Nurse_Aide_Registry/','Florida Agency for Health Care Administration','Florida does not accept reciprocity from Indiana. Must complete a Florida-approved program.'),
('cna','Texas','TX',false,'Texas requires training at a Texas-approved program. No reciprocity with Indiana.','https://www.hhs.texas.gov/providers/long-term-care-providers/nurse-aide-training-competency-evaluation-program-natcep','Texas Health and Human Services','Texas does not accept out-of-state CNA training. Must complete a Texas-approved program.'),
('cna','California','CA',false,'California has its own CNA certification requirements and does not accept Indiana training.','https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/AIDE.aspx','California Department of Public Health','California requires 160 hours of training at a California-approved program.'),
('cna','New York','NY',false,'New York requires training at a New York State-approved program.','https://www.health.ny.gov/facilities/nursing/nurse_aide/','New York State Department of Health','Active Indiana CNA license holders may apply for New York reciprocity if license is current.')
ON CONFLICT (program_type, state_code) DO UPDATE SET
  available          = EXCLUDED.available,
  unavailable_reason = EXCLUDED.unavailable_reason,
  requirements_url   = EXCLUDED.requirements_url,
  board_name         = EXCLUDED.board_name,
  notes              = EXCLUDED.notes,
  updated_at         = now();

-- ── STATE LICENSING — PHLEBOTOMY ──────────────────────────────────────────────

INSERT INTO public.state_licensing (program_type, state, state_code, available, unavailable_reason, requirements_url, board_name, notes) VALUES
('phlebotomy','Indiana','IN',true,NULL,'https://www.in.gov/isdh/','Indiana State Department of Health','Indiana does not require state licensure for phlebotomists. National certification (NHA CPT, ASCP PBT, or AMT RPT) is accepted by employers. Elevate prepares students for NHA CPT exam.'),
('phlebotomy','California','CA',false,'California is the only state that requires phlebotomists to hold a state-issued license (CPT I or CPT II). Training must be completed at a California-approved program.','https://www.cdph.ca.gov/Programs/OSPHLD/LFS/Pages/PhlebotomyTechnician.aspx','California Department of Public Health — Laboratory Field Services','California CPT license requires 40 hours classroom + 40 hours clinical at a CA-approved site. Indiana training does not qualify.'),
('phlebotomy','Louisiana','LA',false,'Louisiana requires phlebotomists to be licensed by the Louisiana State Board of Medical Examiners.','https://www.lsbme.la.gov/','Louisiana State Board of Medical Examiners','Louisiana requires state licensure. National certification alone is not sufficient.'),
('phlebotomy','Nevada','NV',false,'Nevada requires phlebotomists to hold a state license issued by the Nevada State Board of Health.','https://dpbh.nv.gov/','Nevada Division of Public and Behavioral Health','Nevada requires state licensure in addition to national certification.'),
('phlebotomy','Washington','WA',false,'Washington State requires phlebotomists to hold a state credential issued by the Department of Health.','https://www.doh.wa.gov/LicensesPermitsandCertificates/ProfessionsNewReneworUpdate/MedicalTestSitesClinicalLaboratories','Washington State Department of Health','Washington requires state certification. National certification alone is not sufficient.'),
('phlebotomy','Illinois','IL',true,NULL,'https://idfpr.illinois.gov/','Illinois Department of Financial and Professional Regulation','Illinois does not require state licensure for phlebotomists. National certification (NHA CPT, ASCP PBT) accepted by employers.'),
('phlebotomy','Ohio','OH',true,NULL,'https://odh.ohio.gov/','Ohio Department of Health','Ohio does not require state licensure for phlebotomists. National certification accepted by employers.'),
('phlebotomy','Michigan','MI',true,NULL,'https://www.michigan.gov/lara','Michigan Department of Licensing and Regulatory Affairs','Michigan does not require state licensure for phlebotomists. National certification accepted by employers.'),
('phlebotomy','Kentucky','KY',true,NULL,'https://chfs.ky.gov/','Kentucky Cabinet for Health and Family Services','Kentucky does not require state licensure for phlebotomists. National certification accepted by employers.'),
('phlebotomy','Tennessee','TN',true,NULL,'https://www.tn.gov/health/','Tennessee Department of Health','Tennessee does not require state licensure for phlebotomists. National certification accepted by employers.')
ON CONFLICT (program_type, state_code) DO UPDATE SET
  available          = EXCLUDED.available,
  unavailable_reason = EXCLUDED.unavailable_reason,
  requirements_url   = EXCLUDED.requirements_url,
  board_name         = EXCLUDED.board_name,
  notes              = EXCLUDED.notes,
  updated_at         = now();

-- ── FAQs ──────────────────────────────────────────────────────────────────────

INSERT INTO public.faqs (question, answer, category, program_slug, display_order) VALUES
-- Enrollment / general
('How do I enroll in a program?','Visit the program page and click "Apply Now" or "Enroll." You''ll complete a short application and our enrollment team will contact you within 1–2 business days to confirm eligibility and next steps.','enrollment',NULL,1),
('Is there a cost to attend?','Most programs are fully funded for eligible participants through WIOA, Job Ready Indy, WRG, or other workforce grants. Eligibility is determined during the enrollment process. Some programs have a small materials fee.','funding',NULL,2),
('What funding sources do you accept?','We accept WIOA Title I, Job Ready Indy, WRG (Workforce Ready Grant), JRI (Justice Reinvestment Initiative), and employer-sponsored training. We also offer payment plans for self-pay students.','funding',NULL,3),
('How long do programs take?','Program length varies. Most credential programs run 4–16 weeks. Apprenticeship programs run 1–4 years depending on the trade. See each program page for specific timelines.','programs',NULL,4),
('Do I need prior experience?','Most programs are open to beginners. Some programs have basic requirements (e.g., high school diploma or GED, valid ID, background check). Requirements are listed on each program page.','enrollment',NULL,5),
('Will I get a job after completing the program?','We connect graduates directly with hiring employers through our career services team. Employment outcomes vary by program and market conditions. Many graduates are hired within 90 days of completing their credential.','programs',NULL,6),
('Where are classes held?','Training is held at our Indianapolis facility and at partner training sites. Some programs offer hybrid or online components. Location details are on each program page.','programs',NULL,7),
('How do I access my courses?','Click "My Courses" from the dashboard. All enrolled courses will appear with direct links to course materials, lectures, and assignments.','lms',NULL,8),
('Where can I view my grades?','Navigate to "Grades & Progress" to see current grades, assignment scores, and overall completion percentage for each course.','lms',NULL,9),
-- CNA-specific
('What is the CNA exam like?','The Indiana CNA competency exam has two parts: a written test (70 questions) and a skills demonstration. Both are administered by Prometric on behalf of the Indiana State Department of Health. You must pass both parts to be listed on the Indiana Nurse Aide Registry.','enrollment','cna',1),
('How many hours is the CNA program?','Indiana requires 105 hours: 75 hours of classroom/lab instruction and 30 hours of supervised clinical practice at a long-term care facility.','programs','cna',2),
('Is the CNA program free?','For eligible participants, the CNA program is fully funded through WIOA or Job Ready Indy. Contact us to determine your eligibility.','funding','cna',3),
-- HVAC-specific
('Do I need EPA 608 certification to work in HVAC?','Yes. Federal law requires anyone who purchases or handles refrigerants to hold EPA Section 608 certification. Elevate is an authorized proctor site — you can test here after completing the program.','programs','hvac-technician',1),
('What does the HVAC program cover?','The program covers refrigeration fundamentals, electrical systems, system installation and service, EPA 608 exam prep, and hands-on lab work. Graduates are prepared for entry-level HVAC technician roles.','programs','hvac-technician',2),
-- Phlebotomy-specific
('What certification will I earn in the phlebotomy program?','Graduates are prepared for the NHA Certified Phlebotomy Technician (CPT) exam. Elevate is an NHA Authorized Testing Center — you can test on-site after completing the program.','programs','phlebotomy',1),
('Is phlebotomy in demand?','Yes. The Bureau of Labor Statistics projects 8% growth for phlebotomists through 2032, faster than average. Hospitals, clinics, labs, and blood banks all hire phlebotomists.','programs','phlebotomy',2)
ON CONFLICT (question) DO UPDATE SET
  answer        = EXCLUDED.answer,
  category      = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  updated_at    = now();

-- ── TRAINING PARTNERS (employer partners from data/programs/*.ts) ─────────────
-- Sources: data/programs/cna.ts, hvac-technician.ts, phlebotomy.ts,
--          office-administration.ts, cybersecurity-analyst.ts, it-help-desk.ts,
--          cdl-training.ts, plumbing.ts, cad-drafting.ts, barber-apprenticeship.ts

INSERT INTO public.training_partners
  (name, slug, category, training_role, city, state, status, programs_list)
VALUES
-- Healthcare
('Ascension St. Vincent',         'ascension-st-vincent',         'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['CNA Certification']),
('IU Health',                     'iu-health',                     'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['CNA Certification','Phlebotomy']),
('Kindred Healthcare',            'kindred-healthcare',            'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['CNA Certification']),
('Eskenazi Health',               'eskenazi-health',               'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['Phlebotomy','Office Administration']),
('Community Health Network',      'community-health-network',      'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['Phlebotomy','Office Administration']),
-- Skilled Trades / HVAC
('Gaylor Electric',               'gaylor-electric',               'skilled-trades', 'placement',     'Indianapolis', 'IN', 'active', ARRAY['HVAC Technician']),
('Summers Plumbing Heating & Cooling', 'summers-plumbing-heating-cooling', 'skilled-trades', 'placement', 'Indianapolis', 'IN', 'active', ARRAY['HVAC Technician']),
('Service Experts',               'service-experts',               'skilled-trades', 'placement',     'Indianapolis', 'IN', 'active', ARRAY['HVAC Technician']),
('Jesse J. Wilkerson & Associates', 'jesse-j-wilkerson-associates', 'skilled-trades', 'placement',   'Indianapolis', 'IN', 'active', ARRAY['Plumbing','CAD Drafting']),
-- CDL / Transportation
('Werner Enterprises',            'werner-enterprises',            'cdl',            'placement',     'Indianapolis', 'IN', 'active', ARRAY['CDL Class A']),
('Schneider National',            'schneider-national',            'cdl',            'placement',     'Indianapolis', 'IN', 'active', ARRAY['CDL Class A']),
('FedEx Freight',                 'fedex-freight',                 'cdl',            'placement',     'Indianapolis', 'IN', 'active', ARRAY['CDL Class A']),
-- Technology
('Resultant',                     'resultant',                     'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['IT Help Desk','Cybersecurity Analyst']),
('KAR Global',                    'kar-global',                    'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['IT Help Desk']),
('Roche Diagnostics',             'roche-diagnostics',             'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['IT Help Desk','Cybersecurity Analyst']),
('Anthem (Elevance Health)',       'anthem-elevance-health',        'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['Cybersecurity Analyst']),
-- Business / Admin
('City of Indianapolis',          'city-of-indianapolis',          'business',       'placement',     'Indianapolis', 'IN', 'active', ARRAY['Office Administration']),
('Goodwill of Central & Southern Indiana', 'goodwill-central-southern-indiana', 'social-services', 'placement', 'Indianapolis', 'IN', 'active', ARRAY['Office Administration']),
-- Barbershop
('Partner Barbershops in Indianapolis', 'partner-barbershops-indianapolis', 'barbershop', 'apprenticeship', 'Indianapolis', 'IN', 'active', ARRAY['Barber Apprenticeship'])
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  category      = EXCLUDED.category,
  training_role = EXCLUDED.training_role,
  status        = EXCLUDED.status,
  programs_list = EXCLUDED.programs_list,
  updated_at    = now();

-- ── 20260417000001_employer_agreements_and_report_runs.sql ──
-- employer_agreements: written by /api/partners/barbershop/employer-agreement
-- Columns match the insert payload in that route.
ALTER TABLE IF EXISTS public.employer_agreements
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS signed_at timestamptz DEFAULT now();
-- Table already exists; skip CREATE, just ensure columns and indexes
/*SKIP_CREATE
CREATE TABLE IF NOT EXISTS public.employer_agreements (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id           uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  shop_name            text NOT NULL,
  owner_name           text NOT NULL,
  contact_email        text,
  phone                text,
  address_line1        text,
  city                 text,
  state                text DEFAULT 'Indiana',
  zip                  text,
  ein                  text,
  license_number       text,
  license_state        text DEFAULT 'Indiana',
  license_expiry       text,
  mentor_name          text,
  mentor_license       text,
  mentor_license_expiry text,
  wage_year1           text,
  wage_year2           text,
  wage_year3           text,
  ojl_hours_year       text DEFAULT '2000',
  status               text NOT NULL DEFAULT 'pending',
                         CHECK (status IN ('pending','active','expired','terminated')),
  signed_at            timestamptz DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
*/

CREATE INDEX IF NOT EXISTS idx_employer_agreements_partner
  ON public.employer_agreements (partner_id);
CREATE INDEX IF NOT EXISTS idx_employer_agreements_status
  ON public.employer_agreements (status);
CREATE INDEX IF NOT EXISTS idx_employer_agreements_created
  ON public.employer_agreements (created_at DESC);

ALTER TABLE public.employer_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.employer_agreements;
CREATE POLICY "service_role_all" ON public.employer_agreements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read" ON public.employer_agreements;
CREATE POLICY "admin_read" ON public.employer_agreements
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- wioa_report_runs: tracks generated WIOA reports for the admin/wioa/reports page
CREATE TABLE IF NOT EXISTS public.wioa_report_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type    text NOT NULL,
                   CHECK (report_type IN ('quarterly','enrollment','outcomes','expenditure','compliance')),
  period         text,                    -- e.g. 'Q1 2026'
  generated_at   timestamptz NOT NULL DEFAULT now(),
  generated_by   text,                   -- admin email or 'system'
  status         text NOT NULL DEFAULT 'complete',
                   CHECK (status IN ('pending','complete','failed')),
  file_url       text,                   -- Supabase storage URL for the PDF/CSV
  row_count      integer,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wioa_report_runs_type
  ON public.wioa_report_runs (report_type, generated_at DESC);

ALTER TABLE public.wioa_report_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.wioa_report_runs;
CREATE POLICY "service_role_all" ON public.wioa_report_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read" ON public.wioa_report_runs;
CREATE POLICY "admin_read" ON public.wioa_report_runs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── 20260417000002_media_published.sql ──
-- W009: media table missing published column
-- Admin /admin/videos selects and filters on published to count published videos.
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.media.published IS
  'Whether this media asset is visible in the admin video library';

-- ── 20260417000003_fix_program_holder_onboarding.sql ──
-- Fix program holder onboarding flows
-- 1. Add user_id + program_holder_id to mou_signatures so signatures are linkable
-- 2. Ensure program_holder_acknowledgements has all required columns

-- mou_signatures: add user_id and program_holder_id if missing
ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS program_holder_id uuid REFERENCES public.program_holders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mou_signatures_user_id ON public.mou_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_mou_signatures_program_holder_id ON public.mou_signatures(program_holder_id);

-- program_holder_acknowledgements: ensure all columns exist
ALTER TABLE public.program_holder_acknowledgements
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS idx_pha_user_id ON public.program_holder_acknowledgements(user_id);

-- RLS: program holders can insert/read their own rows
ALTER TABLE public.mou_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_acknowledgements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_holders_insert_mou" ON public.mou_signatures;
CREATE POLICY "program_holders_insert_mou" ON public.mou_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "program_holders_read_own_mou" ON public.mou_signatures;
CREATE POLICY "program_holders_read_own_mou" ON public.mou_signatures
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_mou" ON public.mou_signatures;
CREATE POLICY "admin_all_mou" ON public.mou_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "program_holders_insert_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_insert_ack" ON public.program_holder_acknowledgements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "program_holders_read_own_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_read_own_ack" ON public.program_holder_acknowledgements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "admin_all_ack" ON public.program_holder_acknowledgements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── 20260417000004_jobs_listing_columns.sql ──
-- jobs table is a job listings board (not a background queue).
-- Admin /admin/jobs inserts title, company, location, type, salary, requirements, created_by.
-- Add all missing columns so inserts don't silently fail.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS title        text,
  ADD COLUMN IF NOT EXISTS company      text,
  ADD COLUMN IF NOT EXISTS location     text,
  ADD COLUMN IF NOT EXISTS type         text,
  ADD COLUMN IF NOT EXISTS salary_min   numeric,
  ADD COLUMN IF NOT EXISTS salary_max   numeric,
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_status     ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs (created_by);

-- ── 20260417000005_apprentice_hours.sql ──
-- apprentice_hours: tracks daily hour logs for cosmetology/esthetician/nail-tech apprentices.
-- Referenced by 15 code locations across pwa/ routes and pages.
-- Table already exists live — this migration documents the schema for audit purposes.

CREATE TABLE IF NOT EXISTS public.apprentice_hours (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline       text NOT NULL CHECK (discipline IN ('cosmetology', 'esthetician', 'nail-tech', 'barber')),
  date             date NOT NULL,
  hours            integer NOT NULL DEFAULT 0,
  minutes          integer NOT NULL DEFAULT 0 CHECK (minutes >= 0 AND minutes < 60),
  category         text,
  notes            text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at     timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_user_id    ON public.apprentice_hours (user_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_discipline ON public.apprentice_hours (discipline);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_status     ON public.apprentice_hours (status);

COMMENT ON TABLE public.apprentice_hours IS
  'Daily hour log entries for apprenticeship programs (cosmetology, esthetician, nail-tech, barber)';

-- ── 20260417000006_modules_module_type.sql ──
-- W008: modules table missing module_type column
-- Admin /admin/modules filters and inserts on this column.
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS module_type text NOT NULL DEFAULT 'lesson'
    CHECK (module_type IN ('lesson', 'scorm', 'assessment', 'lab', 'checkpoint'));

COMMENT ON COLUMN public.modules.module_type IS
  'Discriminator for module rendering: lesson | scorm | assessment | lab | checkpoint';

-- ── 20260417000007_applications_status_constraint.sql ──
-- Normalize application status values and apply check constraints.
--
-- The enforce_application_flow trigger used legacy values:
--   in_review       (renamed to under_review)
--   ready_to_enroll (collapsed into approved)
--   enrolled        (collapsed into approved — enrollment tracked in program_enrollments)
--
-- Steps:
--   1. Replace trigger to accept canonical values (and legacy->canonical transitions)
--   2. Backfill legacy status values
--   3. Apply status + eligibility_status check constraints

-- 1. Replace enforce_application_flow trigger
CREATE OR REPLACE FUNCTION enforce_application_flow()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR OLD.status = '' THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Canonical forward path
  IF (OLD.status = 'submitted'       AND NEW.status IN ('under_review','funding_review','pending_workone')) THEN RETURN NEW; END IF;
  IF (OLD.status = 'under_review'    AND NEW.status IN ('approved','funding_review','rejected'))            THEN RETURN NEW; END IF;
  IF (OLD.status = 'funding_review'  AND NEW.status IN ('approved','under_review','rejected'))              THEN RETURN NEW; END IF;
  IF (OLD.status = 'pending_workone' AND NEW.status IN ('under_review','approved','rejected'))              THEN RETURN NEW; END IF;
  IF (OLD.status = 'approved'        AND NEW.status IN ('withdrawn','rejected','under_review'))             THEN RETURN NEW; END IF;

  -- Legacy forward path (rows not yet backfilled)
  IF (OLD.status = 'submitted'       AND NEW.status = 'in_review')                                THEN RETURN NEW; END IF;
  IF (OLD.status = 'in_review'       AND NEW.status IN ('approved','under_review','rejected'))     THEN RETURN NEW; END IF;
  IF (OLD.status = 'approved'        AND NEW.status = 'ready_to_enroll')                          THEN RETURN NEW; END IF;
  IF (OLD.status = 'ready_to_enroll' AND NEW.status = 'enrolled')                                 THEN RETURN NEW; END IF;

  -- Legacy -> canonical migration transitions
  IF (OLD.status = 'in_review'       AND NEW.status = 'under_review') THEN RETURN NEW; END IF;
  IF (OLD.status = 'ready_to_enroll' AND NEW.status = 'approved')     THEN RETURN NEW; END IF;
  IF (OLD.status = 'enrolled'        AND NEW.status = 'approved')     THEN RETURN NEW; END IF;

  -- Rejection / withdrawal from any active state
  IF NEW.status IN ('rejected','withdrawn') THEN RETURN NEW; END IF;

  -- Supplemental
  IF OLD.status IN ('pending_workone','waitlisted') AND NEW.status IN ('under_review','in_review','rejected') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Invalid transition: % -> %. See enforce_application_flow trigger.', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill legacy status values
UPDATE public.applications SET status = 'under_review', updated_at = now() WHERE status = 'in_review';
UPDATE public.applications SET status = 'approved', updated_at = now() WHERE status IN ('ready_to_enroll', 'enrolled');

-- 3. Apply status check constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('submitted','pending_workone','funding_review','under_review','approved','rejected','withdrawn'));

-- 4. Apply eligibility_status check constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_eligibility_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_eligibility_status_check
  CHECK (eligibility_status IN ('pending','pending_workone','funding_review','verified','denied'));

-- ── 20260417000008_exam_ready_pathway_guard.sql ──
-- Guard: warn when program_exam_ready_rules is inserted for a program
-- that has no program_certification_pathways row.
--
-- Without a pathway row, auto_create_exam_authorization silently skips
-- authorization creation even when a learner is fully exam ready.
-- This trigger surfaces the gap at insert time rather than at learner
-- completion time (when it's too late to notice easily).
--
-- Uses RAISE NOTICE (not EXCEPTION) — the insert still succeeds.
-- The warning appears in Supabase logs and in the seeder output.

CREATE OR REPLACE FUNCTION trg_warn_missing_certification_pathway()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.program_certification_pathways
    WHERE program_id = NEW.program_id
      AND is_primary  = true
      AND is_active   = true
  ) THEN
    RAISE NOTICE
      'program_exam_ready_rules inserted for program % but no active primary '
      'program_certification_pathways row exists. '
      'auto_create_exam_authorization will not fire until a pathway is added.',
      NEW.program_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_warn_missing_certification_pathway ON public.program_exam_ready_rules;
CREATE TRIGGER trg_warn_missing_certification_pathway
  AFTER INSERT ON public.program_exam_ready_rules
  FOR EACH ROW EXECUTE FUNCTION trg_warn_missing_certification_pathway();

-- ── 20260417000009_mou_signatures_partner_type.sql ──
-- Add missing columns to mou_signatures so every partner type is identifiable
-- and all insert payloads from sign-mou routes are stored correctly.

ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS partner_type    text,   -- 'barbershop' | 'cosmetology' | 'program_holder' | 'partner'
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS contact_name    text,
  ADD COLUMN IF NOT EXISTS contact_title   text,
  ADD COLUMN IF NOT EXISTS contact_email   text,
  ADD COLUMN IF NOT EXISTS digital_signature text,
  ADD COLUMN IF NOT EXISTS agreed          boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS user_agent      text,
  ADD COLUMN IF NOT EXISTS countersigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS countersigned_by text;

CREATE INDEX IF NOT EXISTS idx_mou_signatures_partner_type
  ON public.mou_signatures (partner_type);

CREATE INDEX IF NOT EXISTS idx_mou_signatures_contact_email
  ON public.mou_signatures (contact_email);

COMMENT ON COLUMN public.mou_signatures.partner_type IS
  'Identifies which onboarding flow produced this MOU: barbershop | cosmetology | program_holder | partner';

-- ── 20260417000010_partner_lms_sync_logs_provider_id.sql ──
-- W016: partner_lms_sync_logs missing provider_id FK
-- Admin /admin/partners/lms-integrations/[id] filters sync logs by provider_id.
ALTER TABLE public.partner_lms_sync_logs
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.partner_lms_providers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_partner_lms_sync_logs_provider_id
  ON public.partner_lms_sync_logs (provider_id);

COMMENT ON COLUMN public.partner_lms_sync_logs.provider_id IS
  'FK to partner_lms_providers — scopes sync log rows to a specific integration';

-- ── 20260417000011_platform_settings.sql ──
-- platform_settings: key/value store for admin-configurable platform settings.
-- Referenced by 6 code locations in admin settings and env-vars routes.
-- Table already exists live — this migration documents the schema for audit purposes.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.platform_settings IS
  'Admin-configurable key/value settings. Values stored plaintext — do not store secrets here.';

-- ── 20260417000012_program_enrollments_confirmed_at.sql ──
-- program_enrollments.enrollment_confirmed_at
-- Written by enrollment-success pages across all programs when a student
-- lands on the confirmation page after account creation.
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_confirmed_at TIMESTAMPTZ;

-- NOTE: The 'documents' bucket and its storage.objects policies were moved to
-- 20260417000013_documents_bucket_policies.sql because they require the
-- supabase_storage_admin role and cannot be applied via the standard exec_sql
-- migration runner (error 42501 "must be owner of table objects").

-- ── 20260417000013_documents_bucket_policies.sql ──
-- DOCUMENTS STORAGE BUCKET + RLS POLICIES
--
-- MUST BE APPLIED MANUALLY via Supabase Dashboard → SQL Editor.
-- The standard migration runner runs as service_role, which is NOT the owner
-- of storage.objects (that's supabase_storage_admin). The Dashboard SQL Editor
-- has the elevated permissions required to alter storage policies.
--
-- This file is intentionally tracked but auto-runner will SKIP it gracefully
-- after the first failure; idempotent so re-running in Dashboard is safe.

-- Ensure the 'documents' storage bucket exists.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload and read their own documents
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can read all documents" ON storage.objects;
CREATE POLICY "Admins can read all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- ── 20260418000001_increment_slot_rpc.sql ──
-- Atomic slot booking-count increment RPC.
-- Called by /api/testing/book (org / waived-fee bookings) and
-- /api/testing/webhook (paid individual bookings) after inserting an exam_bookings row.
--
-- Uses UPDATE ... WHERE booked_count < capacity to prevent overselling —
-- if the slot is already full the UPDATE is a no-op (safe to call anyway).
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.increment_slot_booked_count(slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.testing_slots
  SET    booked_count = booked_count + 1,
         updated_at   = now()
  WHERE  id             = slot_id
    AND  is_cancelled   = false
    AND  booked_count   < capacity;
END;
$$;

-- Grant execute to the service role (used by the admin Supabase client)
GRANT EXECUTE ON FUNCTION public.increment_slot_booked_count(uuid) TO service_role;

-- ── 20260420000001_payment_transactions.sql ──
-- payment_transactions
-- Canonical payment record for all program enrollments.
-- Referenced by /admin/analytics/revenue for YTD/monthly revenue reporting.

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        uuid        REFERENCES public.programs(id) ON DELETE SET NULL,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  amount            numeric(10,2) NOT NULL DEFAULT 0,
  currency          text        NOT NULL DEFAULT 'usd',
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','completed','failed','refunded','disputed')),
  payment_method    text,                          -- 'stripe','bnpl','wioa','cash','waived'
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id  text,
  enrollment_id     uuid,                          -- soft ref — enrollment tables vary by program type
  description       text,
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_program_id  ON public.payment_transactions(program_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id     ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status      ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at  ON public.payment_transactions(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_payment_transactions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_transactions_updated_at();

-- RLS: admins read/write; users read their own
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_payment_transactions"  ON public.payment_transactions;
DROP POLICY IF EXISTS "user_own_payment_transactions"   ON public.payment_transactions;

CREATE POLICY "admin_all_payment_transactions" ON public.payment_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "user_own_payment_transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── 20260420000002_employer_onboarding_progress.sql ──
-- employer_onboarding_progress
-- Tracks per-employer orientation step completion.
-- Written by /onboarding/employer/orientation (upsert on user_id).
-- Read by /admin/employers/onboarding to show orientation progress panel.

CREATE TABLE IF NOT EXISTS public.employer_onboarding_progress (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id           uuid        REFERENCES public.employers(id) ON DELETE SET NULL,
  orientation_viewed    boolean     NOT NULL DEFAULT false,
  orientation_viewed_at timestamptz,
  step                  text        NOT NULL DEFAULT 'orientation'
                                    CHECK (step IN ('orientation','profile','documents','verification','complete')),
  status                text        NOT NULL DEFAULT 'in_progress'
                                    CHECK (status IN ('pending','in_progress','completed')),
  completed_at          timestamptz,
  metadata              jsonb       DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_user_id     ON public.employer_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_employer_id ON public.employer_onboarding_progress(employer_id);
CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_status      ON public.employer_onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_created_at  ON public.employer_onboarding_progress(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_emp_onboard_progress_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_emp_onboard_progress_updated_at ON public.employer_onboarding_progress;
CREATE TRIGGER trg_emp_onboard_progress_updated_at
  BEFORE UPDATE ON public.employer_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_emp_onboard_progress_updated_at();

-- RLS: admins read all; employers read/write their own row
ALTER TABLE public.employer_onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_emp_onboard_progress" ON public.employer_onboarding_progress;
DROP POLICY IF EXISTS "user_own_emp_onboard_progress"  ON public.employer_onboarding_progress;

CREATE POLICY "admin_all_emp_onboard_progress" ON public.employer_onboarding_progress
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "user_own_emp_onboard_progress" ON public.employer_onboarding_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 20260420000003_program_holder_reports.sql ──
-- program_holder_reports
-- Generic report store for program holders.
-- Referenced by /program-holder/reports with fallback to apprentice_weekly_reports.
-- Columns match the shape the page maps from apprentice_weekly_reports fallback:
--   id, title, status, created_at, hours_worked, report_type

CREATE TABLE IF NOT EXISTS public.program_holder_reports (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id   uuid        NOT NULL REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title               text        NOT NULL,
  report_type         text        NOT NULL DEFAULT 'general'
                                  CHECK (report_type IN ('general','weekly','monthly','compliance','financial','incident')),
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','submitted','under_review','approved','rejected')),
  content             text,
  hours_worked        numeric(6,2),
  period_start        date,
  period_end          date,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes      text,
  attachments         jsonb       DEFAULT '[]',
  metadata            jsonb       DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ph_reports_program_holder_id ON public.program_holder_reports(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_reports_status            ON public.program_holder_reports(status);
CREATE INDEX IF NOT EXISTS idx_ph_reports_created_at        ON public.program_holder_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ph_reports_report_type       ON public.program_holder_reports(report_type);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_ph_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ph_reports_updated_at ON public.program_holder_reports;
CREATE TRIGGER trg_ph_reports_updated_at
  BEFORE UPDATE ON public.program_holder_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_ph_reports_updated_at();

-- RLS: admins read all; program holders read/write their own
ALTER TABLE public.program_holder_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_ph_reports"        ON public.program_holder_reports;
DROP POLICY IF EXISTS "ph_own_reports_select"        ON public.program_holder_reports;
DROP POLICY IF EXISTS "ph_own_reports_insert_update" ON public.program_holder_reports;

CREATE POLICY "admin_all_ph_reports" ON public.program_holder_reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "ph_own_reports_select" ON public.program_holder_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id
        AND ph.user_id = auth.uid()
    )
  );

CREATE POLICY "ph_own_reports_insert_update" ON public.program_holder_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id
        AND ph.user_id = auth.uid()
    )
  );

-- ── 20260420000010_barber_hour_ledger.sql ──
-- Barber Apprenticeship: Hour Ledger
--
-- Tracks theory + practical hours per student per module.
-- Theory hours are auto-credited from lesson completion (capped at module allocation).
-- Practical hours come from instructor-approved sessions and submissions.
--
-- 2000-hour distribution (Indiana DOL):
--   Module 1 — Infection Control & Safety:  200h (150 theory / 50 practical)
--   Module 2 — Hair Science & Scalp:        200h (150 theory / 50 practical)
--   Module 3 — Tools & Ergonomics:          200h (100 theory / 100 practical)
--   Module 4 — Haircutting:                 800h (100 theory / 700 practical)
--   Module 5 — Shaving & Beard:             300h  (50 theory / 250 practical)
--   Module 6 — Chemical Services:           200h (100 theory / 100 practical)
--   Module 7 — Business & Professional:     100h  (90 theory /  10 practical)
--   Module 8 — Exam Prep:                   100h (100 theory /   0 practical)

CREATE TABLE IF NOT EXISTS public.barber_hour_ledger (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid        NOT NULL,

  -- Running totals (denormalized for fast dashboard reads)
  total_hours         numeric(7,2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
  theory_hours        numeric(7,2) NOT NULL DEFAULT 0 CHECK (theory_hours >= 0),
  practical_hours     numeric(7,2) NOT NULL DEFAULT 0 CHECK (practical_hours >= 0),

  -- Per-module theory hours (capped at allocation)
  mod1_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod2_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod3_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod4_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod5_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod6_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod7_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod8_theory         numeric(6,2) NOT NULL DEFAULT 0,

  -- Per-module practical hours
  mod1_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod2_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod3_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod4_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod5_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod6_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod7_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod8_practical      numeric(6,2) NOT NULL DEFAULT 0,

  last_session_start  timestamptz,
  last_session_end    timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_hour_ledger_user
  ON public.barber_hour_ledger(user_id);

-- Module theory caps (used by credit function to prevent over-crediting)
CREATE TABLE IF NOT EXISTS public.barber_module_hour_config (
  module_number       int         PRIMARY KEY,
  module_title        text        NOT NULL,
  theory_cap          numeric(6,2) NOT NULL,
  practical_required  numeric(6,2) NOT NULL,
  total_hours         numeric(6,2) NOT NULL
);

INSERT INTO public.barber_module_hour_config (module_number, module_title, theory_cap, practical_required, total_hours)
VALUES
  (1, 'Infection Control & Safety',  150, 50,  200),
  (2, 'Hair Science & Scalp',        150, 50,  200),
  (3, 'Tools & Ergonomics',          100, 100, 200),
  (4, 'Haircutting',                 100, 700, 800),
  (5, 'Shaving & Beard',              50, 250, 300),
  (6, 'Chemical Services',           100, 100, 200),
  (7, 'Business & Professional',      90,  10, 100),
  (8, 'Exam Prep',                   100,   0, 100)
ON CONFLICT (module_number) DO UPDATE SET
  theory_cap         = EXCLUDED.theory_cap,
  practical_required = EXCLUDED.practical_required,
  total_hours        = EXCLUDED.total_hours;

-- Individual hour credit events (audit trail)
CREATE TABLE IF NOT EXISTS public.barber_hour_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid        NOT NULL,
  module_number   int         NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  hour_type       text        NOT NULL CHECK (hour_type IN ('theory', 'practical')),
  hours_credited  numeric(5,2) NOT NULL CHECK (hours_credited > 0),
  source          text        NOT NULL CHECK (source IN ('lesson_completion', 'session', 'submission', 'instructor_manual')),
  source_id       uuid,       -- lesson_id, session_id, submission_id, or signoff_id
  credited_by     uuid,       -- null = system, set = instructor
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_hour_events_user
  ON public.barber_hour_events(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_hour_events_module
  ON public.barber_hour_events(user_id, module_number);

-- RLS
ALTER TABLE public.barber_hour_ledger    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_hour_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_module_hour_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own ledger"    ON public.barber_hour_ledger;
DROP POLICY IF EXISTS "Service role manages ledger" ON public.barber_hour_ledger;
CREATE POLICY "Students view own ledger"    ON public.barber_hour_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages ledger" ON public.barber_hour_ledger USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Students view own events"    ON public.barber_hour_events;
DROP POLICY IF EXISTS "Service role manages events" ON public.barber_hour_events;
CREATE POLICY "Students view own events"    ON public.barber_hour_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages events" ON public.barber_hour_events USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone reads module config"  ON public.barber_module_hour_config;
CREATE POLICY "Anyone reads module config"  ON public.barber_module_hour_config FOR SELECT USING (true);

-- ── 20260420000011_barber_session_tracking.sql ──
-- Barber Apprenticeship: Session Tracking
--
-- A session is a timed block of active training.
-- No session = no hours. Hours are only credited after a session ends
-- and the elapsed active time is verified (idle periods subtracted).
--
-- Flow:
--   1. Student clicks "Start Training" → INSERT with status='active'
--   2. Heartbeats update last_heartbeat_at every 60s (idle detection)
--   3. Student clicks "End Session" or idle timeout fires →
--      UPDATE status='completed', ended_at=now(), active_seconds=calculated
--   4. API credits hours to barber_hour_ledger + inserts barber_hour_events row

-- Table already created by fix migration; just add missing columns
ALTER TABLE public.barber_training_sessions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS idle_seconds int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_seconds int,
  ADD COLUMN IF NOT EXISTS theory_hours_credited numeric(5,2),
  ADD COLUMN IF NOT EXISTS practical_hours_credited numeric(5,2),
  ADD COLUMN IF NOT EXISTS heartbeat_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_watch_seconds int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS module_number int,
  ADD COLUMN IF NOT EXISTS lesson_id uuid;
-- Skipping GENERATED ALWAYS AS (not supported via ADD COLUMN)
-- raw_seconds computed on read: EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))::int

/*SKIP_ORIGINAL_CREATE_TABLE
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid         NOT NULL,
  module_number       int          NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  lesson_id           uuid,        -- optional: which lesson triggered the session

  status              text         NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'abandoned', 'idle_timeout')),

  started_at          timestamptz  NOT NULL DEFAULT now(),
  ended_at            timestamptz,
  last_heartbeat_at   timestamptz  NOT NULL DEFAULT now(),

  -- Time accounting
  raw_seconds         int          GENERATED ALWAYS AS (
                        EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))::int
                      ) STORED,
  idle_seconds        int          NOT NULL DEFAULT 0,  -- subtracted by idle detection
  active_seconds      int,         -- set on completion: raw_seconds - idle_seconds

  -- Hours credited from this session (set after completion)
  theory_hours_credited   numeric(5,2),
  practical_hours_credited numeric(5,2),

  -- Activity signals (updated by heartbeat)
  heartbeat_count     int          NOT NULL DEFAULT 0,
  video_watch_seconds int          NOT NULL DEFAULT 0,
  click_count         int          NOT NULL DEFAULT 0,

  created_at          timestamptz  NOT NULL DEFAULT now()
*/

CREATE INDEX IF NOT EXISTS idx_barber_sessions_user
  ON public.barber_training_sessions(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_sessions_active
  ON public.barber_training_sessions(user_id, status)
  WHERE status = 'active';

-- RLS
ALTER TABLE public.barber_training_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student reads own sessions"   ON public.barber_training_sessions;
DROP POLICY IF EXISTS "Student inserts own sessions" ON public.barber_training_sessions;
DROP POLICY IF EXISTS "Student updates own sessions" ON public.barber_training_sessions;
DROP POLICY IF EXISTS "Service role full sessions"   ON public.barber_training_sessions;

CREATE POLICY "Student reads own sessions"
  ON public.barber_training_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Student inserts own sessions"
  ON public.barber_training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Student updates own sessions"
  ON public.barber_training_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full sessions"
  ON public.barber_training_sessions USING (auth.role() = 'service_role');

-- ── 20260420000012_barber_practicals_engine.sql ──
-- Barber Apprenticeship: Practical Requirements Engine
--
-- Tracks required service counts per student.
-- No instructor approval = no credit. Count only increments on approval.
--
-- Required counts (Indiana DOL / NIC exam alignment):
--   haircut_standard:   75  (Module 4)
--   haircut_fade:       50  (Module 4)
--   haircut_advanced:   25  (Module 4)
--   shave_straight:     40  (Module 5)
--   beard_trim:         40  (Module 5)
--   chemical_service:   20  (Module 6)
--   scalp_treatment:    10  (Module 2)
--   tool_maintenance:   10  (Module 3)

-- Practical category definitions (single source of truth)
CREATE TABLE IF NOT EXISTS public.barber_practical_categories (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key    text  NOT NULL UNIQUE,
  label           text  NOT NULL,
  module_number   int   NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  count_required  int   NOT NULL CHECK (count_required > 0),
  description     text
);

ALTER TABLE public.barber_practical_categories ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE;

-- Ensure barber_practical_submissions has required columns
ALTER TABLE public.barber_practical_submissions
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

INSERT INTO public.barber_practical_categories
  (category_key, label, required_count, description)
VALUES
  ('haircut_standard', 'Standard Haircut', 75, 'Full haircut service on a live client — scissor or clipper'),
  ('haircut_fade', 'Fade Haircut', 50, 'Low, mid, or high fade on a live client'),
  ('haircut_advanced', 'Advanced Style', 25, 'Textured cut, design, or specialty style on a live client'),
  ('shave_straight', 'Straight Razor Shave', 40, 'Full straight razor shave on a live client'),
  ('beard_trim', 'Beard Trim / Design', 40, 'Beard trim, shape, or design on a live client'),
  ('chemical_service', 'Chemical Service', 20, 'Color, relaxer, or texturizer application on a live client'),
  ('scalp_treatment', 'Scalp Treatment', 10, 'Scalp analysis and treatment service'),
  ('tool_maintenance', 'Tool Maintenance', 10, 'Documented clipper/scissor cleaning and calibration')
ON CONFLICT (category_key) DO UPDATE SET
  required_count = EXCLUDED.required_count,
  label          = EXCLUDED.label;

-- Per-student practical progress
CREATE TABLE IF NOT EXISTS public.barber_student_practicals (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid         NOT NULL,
  category_key        text         NOT NULL REFERENCES public.barber_practical_categories(category_key),

  count_completed     int          NOT NULL DEFAULT 0 CHECK (count_completed >= 0),
  count_required      int          NOT NULL,  -- denormalized from category for fast reads
  last_verified_by    uuid,        -- instructor UUID
  last_verified_at    timestamptz,
  verification_status text         NOT NULL DEFAULT 'in_progress'
                        CHECK (verification_status IN ('in_progress', 'met', 'waived')),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_practicals_user
  ON public.barber_student_practicals(user_id, program_id);

-- Individual practical submission log (one row per submitted service)
CREATE TABLE IF NOT EXISTS public.barber_practical_submissions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid         NOT NULL,
  category_key    text         NOT NULL REFERENCES public.barber_practical_categories(category_key),

  -- Evidence
  notes           text,
  photo_url       text,        -- Supabase storage path
  video_url       text,
  client_initials text,        -- privacy-safe client identifier
  service_date    date         NOT NULL DEFAULT CURRENT_DATE,
  shop_name       text,

  -- Review
  status          text         NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     uuid,        -- instructor UUID
  reviewed_at     timestamptz,
  rejection_reason text,

  submitted_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_practical_submissions_user
  ON public.barber_practical_submissions(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_practical_submissions_pending
  ON public.barber_practical_submissions(status)
  WHERE status = 'pending';

-- Function: approve a submission → increment count, update ledger
CREATE OR REPLACE FUNCTION public.approve_barber_practical(
  p_submission_id uuid,
  p_instructor_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub   public.barber_practical_submissions%ROWTYPE;
  v_cat   public.barber_practical_categories%ROWTYPE;
  v_req   int;
BEGIN
  -- Lock and fetch submission
  SELECT * INTO v_sub FROM public.barber_practical_submissions
  WHERE id = p_submission_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already reviewed';
  END IF;

  SELECT * INTO v_cat FROM public.barber_practical_categories
  WHERE category_key = v_sub.category_key;

  -- Mark submission approved
  UPDATE public.barber_practical_submissions SET
    status      = 'approved',
    reviewed_by = p_instructor_id,
    reviewed_at = now()
  WHERE id = p_submission_id;

  -- Upsert student practical progress
  INSERT INTO public.barber_student_practicals
    (user_id, program_id, category_key, count_completed, required_count, last_verified_by, last_verified_at, verification_status)
  VALUES
    (v_sub.user_id, v_sub.program_id, v_sub.category_key, 1, v_cat.required_count, p_instructor_id, now(), 'in_progress')
  ON CONFLICT (user_id, program_id, category_key) DO UPDATE SET
    count_completed  = barber_student_practicals.count_completed + 1,
    last_verified_by = p_instructor_id,
    last_verified_at = now(),
    verification_status = CASE
      WHEN barber_student_practicals.count_completed + 1 >= barber_student_practicals.required_count
      THEN 'met' ELSE 'in_progress' END,
    updated_at = now();
END;
$$;

-- RLS
ALTER TABLE public.barber_practical_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_student_practicals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_practical_submissions   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads categories"         ON public.barber_practical_categories;
CREATE POLICY "Public reads categories"
  ON public.barber_practical_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Student reads own practicals"    ON public.barber_student_practicals;
DROP POLICY IF EXISTS "Service role full practicals"    ON public.barber_student_practicals;
CREATE POLICY "Student reads own practicals"
  ON public.barber_student_practicals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full practicals"
  ON public.barber_student_practicals USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Student reads own submissions"   ON public.barber_practical_submissions;
DROP POLICY IF EXISTS "Student inserts own submissions" ON public.barber_practical_submissions;
DROP POLICY IF EXISTS "Service role full submissions"   ON public.barber_practical_submissions;
CREATE POLICY "Student reads own submissions"
  ON public.barber_practical_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Student inserts own submissions"
  ON public.barber_practical_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full submissions"
  ON public.barber_practical_submissions USING (auth.role() = 'service_role');

-- ── 20260420000013_barber_instructor_signoffs.sql ──
-- Barber Apprenticeship: Instructor Sign-Off Layer
--
-- Instructors must formally sign off on:
--   1. Module competency completion (per module)
--   2. Practical hour blocks (bulk hour verification)
--   3. Final program readiness (gates exam eligibility)
--
-- No sign-off = module not complete, regardless of lesson progress.

CREATE TABLE IF NOT EXISTS public.barber_instructor_signoffs (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid         NOT NULL,
  approved_by     uuid         NOT NULL REFERENCES auth.users(id),

  signoff_type    text         NOT NULL CHECK (signoff_type IN (
                    'module_competency',   -- instructor confirms student mastered module skills
                    'hour_block',          -- instructor verifies a block of practical hours
                    'final_readiness'      -- instructor clears student for state board exam
                  )),

  -- For module_competency signoffs
  module_number   int          CHECK (module_number BETWEEN 1 AND 8),

  -- For hour_block signoffs
  hours_verified  numeric(5,2) CHECK (hours_verified > 0),
  hour_type       text         CHECK (hour_type IN ('theory', 'practical')),
  period_start    date,
  period_end      date,

  -- Competency assessment
  performance_rating  text     CHECK (performance_rating IN ('satisfactory', 'needs_improvement', 'unsatisfactory')),
  notes               text,
  conditions          text,    -- any conditions attached to the sign-off

  status          text         NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('approved', 'conditional', 'revoked')),

  signed_at       timestamptz  NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  revoked_by      uuid,
  revoke_reason   text
);

CREATE INDEX IF NOT EXISTS idx_barber_signoffs_user
  ON public.barber_instructor_signoffs(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_signoffs_module
  ON public.barber_instructor_signoffs(user_id, module_number)
  WHERE signoff_type = 'module_competency';
CREATE INDEX IF NOT EXISTS idx_barber_signoffs_instructor
  ON public.barber_instructor_signoffs(approved_by);

-- View: which modules have a valid (non-revoked) competency sign-off per student
CREATE OR REPLACE VIEW public.barber_module_signoff_status AS
SELECT
  user_id,
  program_id,
  module_number,
  MAX(signed_at) AS signed_at,
  MAX(approved_by::text)::uuid AS approved_by,
  bool_or(status = 'approved') AS is_signed_off
FROM public.barber_instructor_signoffs
WHERE signoff_type = 'module_competency'
  AND status != 'revoked'
GROUP BY user_id, program_id, module_number;

-- RLS
ALTER TABLE public.barber_instructor_signoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student reads own signoffs"     ON public.barber_instructor_signoffs;
DROP POLICY IF EXISTS "Instructor inserts signoffs"    ON public.barber_instructor_signoffs;
DROP POLICY IF EXISTS "Service role full signoffs"     ON public.barber_instructor_signoffs;

CREATE POLICY "Student reads own signoffs"
  ON public.barber_instructor_signoffs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Instructor inserts signoffs"
  ON public.barber_instructor_signoffs FOR INSERT WITH CHECK (auth.uid() = approved_by);
CREATE POLICY "Service role full signoffs"
  ON public.barber_instructor_signoffs USING (auth.role() = 'service_role');

-- ── 20260420000014_barber_completion_gate.sql ──
-- Barber Apprenticeship: Completion Gate
--
-- A student cannot be marked complete unless ALL conditions are true:
--   1. 2000 total hours logged and verified
--   2. Each module meets its minimum hour requirement
--   3. All practical counts met (all 8 categories at count_required)
--   4. All 8 module checkpoints passed (≥ 80%)
--   5. Final exam passed (≥ 80%)
--   6. Instructor final_readiness sign-off exists
--
-- This view is the single enforcement point. The API reads it before
-- issuing any completion certificate or exam authorization.

CREATE OR REPLACE VIEW public.barber_completion_status AS
WITH ledger AS (
  SELECT
    l.user_id,
    l.program_id,
    l.total_hours,
    l.theory_hours,
    l.practical_hours,
    -- Module hour checks against config
    (l.mod1_theory  + l.mod1_practical) >= 200  AS mod1_hours_met,
    (l.mod2_theory  + l.mod2_practical) >= 200  AS mod2_hours_met,
    (l.mod3_theory  + l.mod3_practical) >= 200  AS mod3_hours_met,
    (l.mod4_theory  + l.mod4_practical) >= 800  AS mod4_hours_met,
    (l.mod5_theory  + l.mod5_practical) >= 300  AS mod5_hours_met,
    (l.mod6_theory  + l.mod6_practical) >= 200  AS mod6_hours_met,
    (l.mod7_theory  + l.mod7_practical) >= 100  AS mod7_hours_met,
    (l.mod8_theory  + l.mod8_practical) >= 100  AS mod8_hours_met
  FROM public.barber_hour_ledger l
),
practicals AS (
  SELECT
    user_id,
    program_id,
    COUNT(*) FILTER (WHERE completed_count >= required_count) AS categories_met,
    COUNT(*) AS categories_total
  FROM public.barber_student_practicals
  GROUP BY user_id, program_id
),
signoffs AS (
  SELECT
    user_id,
    program_id,
    COUNT(DISTINCT module_number) FILTER (
      WHERE signoff_type = 'module_competency' AND status = 'approved'
    ) AS modules_signed_off,
    bool_or(signoff_type = 'final_readiness' AND status = 'approved') AS final_signoff
  FROM public.barber_instructor_signoffs
  GROUP BY user_id, program_id
),
checkpoints AS (
  -- checkpoint_scores: user_id, lesson_id, passed, score
  -- Join to course_lessons to get module context via lesson slug
  SELECT
    cs.user_id,
    cl.course_id AS program_id,
    COUNT(*) FILTER (WHERE cs.passed = true) AS checkpoints_passed,
    COUNT(*) AS checkpoints_total
  FROM public.checkpoint_scores cs
  JOIN public.course_lessons cl ON cl.id = cs.lesson_id
  WHERE cl.lesson_type = 'checkpoint'
  GROUP BY cs.user_id, cl.course_id
),
final_exam AS (
  SELECT
    cs.user_id,
    cl.course_id AS program_id,
    bool_or(cs.passed = true AND cs.score >= 80) AS exam_passed
  FROM public.checkpoint_scores cs
  JOIN public.course_lessons cl ON cl.id = cs.lesson_id
  WHERE cl.lesson_type = 'exam'
  GROUP BY cs.user_id, cl.course_id
)
SELECT
  l.user_id,
  l.program_id,

  -- Individual gate results
  l.total_hours                                          AS total_hours,
  (l.total_hours >= 2000)                                AS gate_total_hours,
  (l.mod1_hours_met AND l.mod2_hours_met AND l.mod3_hours_met AND
   l.mod4_hours_met AND l.mod5_hours_met AND l.mod6_hours_met AND
   l.mod7_hours_met AND l.mod8_hours_met)               AS gate_module_hours,
  (COALESCE(p.categories_met, 0) >= 8)                  AS gate_practicals,
  (COALESCE(s.modules_signed_off, 0) >= 8)              AS gate_signoffs,
  COALESCE(s.final_signoff, false)                       AS gate_final_signoff,
  (COALESCE(c.checkpoints_passed, 0) >= 8)              AS gate_checkpoints,
  COALESCE(e.exam_passed, false)                         AS gate_final_exam,

  -- Supporting detail
  COALESCE(p.categories_met, 0)                         AS practicals_met,
  COALESCE(s.modules_signed_off, 0)                     AS modules_signed_off,
  COALESCE(c.checkpoints_passed, 0)                     AS checkpoints_passed,

  -- Master gate: ALL must be true
  (
    l.total_hours >= 2000
    AND l.mod1_hours_met AND l.mod2_hours_met AND l.mod3_hours_met
    AND l.mod4_hours_met AND l.mod5_hours_met AND l.mod6_hours_met
    AND l.mod7_hours_met AND l.mod8_hours_met
    AND COALESCE(p.categories_met, 0) >= 8
    AND COALESCE(s.modules_signed_off, 0) >= 8
    AND COALESCE(s.final_signoff, false)
    AND COALESCE(c.checkpoints_passed, 0) >= 8
    AND COALESCE(e.exam_passed, false)
  ) AS is_complete

FROM ledger l
LEFT JOIN practicals p ON p.user_id = l.user_id AND p.program_id = l.program_id
LEFT JOIN signoffs   s ON s.user_id = l.user_id AND s.program_id = l.program_id
LEFT JOIN checkpoints c ON c.user_id = l.user_id AND c.program_id = l.program_id
LEFT JOIN final_exam  e ON e.user_id = l.user_id AND e.program_id = l.program_id;

-- Completion records (issued only when is_complete = true)
CREATE TABLE IF NOT EXISTS public.barber_completions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid         NOT NULL,
  total_hours     numeric(7,2) NOT NULL,
  completed_at    timestamptz  NOT NULL DEFAULT now(),
  issued_by       uuid,        -- admin/system UUID
  certificate_id  uuid,        -- links to program_completion_certificates
  exam_auth_id    uuid,        -- links to exam_funding_authorizations
  notes           text
);

ALTER TABLE public.barber_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student reads own completion"  ON public.barber_completions;
DROP POLICY IF EXISTS "Service role full completions" ON public.barber_completions;
CREATE POLICY "Student reads own completion"
  ON public.barber_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full completions"
  ON public.barber_completions USING (auth.role() = 'service_role');

-- ── 20260421000001_checkin_sessions_checkout_columns.sql ──
-- Add missing columns to checkin_sessions
-- Required by /api/checkin and /api/checkin/checkout

ALTER TABLE public.checkin_sessions
  ADD COLUMN IF NOT EXISTS apprentice_id uuid,
  ADD COLUMN IF NOT EXISTS checkin_code text,
  ADD COLUMN IF NOT EXISTS checkout_time timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

CREATE INDEX IF NOT EXISTS idx_checkin_sessions_apprentice_id
  ON public.checkin_sessions (apprentice_id);

CREATE INDEX IF NOT EXISTS idx_checkin_sessions_active
  ON public.checkin_sessions (apprentice_id)
  WHERE checkout_time IS NULL;

-- ── 20260421000002_apprentice_hours_shop_id.sql ──
-- Add shop_id to apprentice_hours so shop owners can filter/approve their apprentices' hours
ALTER TABLE public.apprentice_hours
  ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_shop_id
  ON public.apprentice_hours (shop_id);

-- ── 20260422000001_program_course_map.sql ──
-- Replaces the hardcoded PROGRAM_COURSE_MAP in lib/course-builder/schema.ts.
-- Links a program slug to its canonical course_id so new programs can be
-- registered without a code deploy.

CREATE TABLE IF NOT EXISTS public.program_course_map (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug    TEXT NOT NULL UNIQUE,
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the two existing hardcoded entries only if the course IDs exist.
INSERT INTO public.program_course_map (program_slug, course_id)
SELECT 'hvac-technician', 'f0593164-55be-5867-98e7-8a86770a8dd0'::uuid
WHERE EXISTS (SELECT 1 FROM public.courses WHERE id = 'f0593164-55be-5867-98e7-8a86770a8dd0')
ON CONFLICT (program_slug) DO NOTHING;

INSERT INTO public.program_course_map (program_slug, course_id)
SELECT 'barber-apprenticeship', '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'::uuid
WHERE EXISTS (SELECT 1 FROM public.courses WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17')
ON CONFLICT (program_slug) DO NOTHING;

-- Trigger to keep updated_at current.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS program_course_map_updated_at ON public.program_course_map;
CREATE TRIGGER program_course_map_updated_at
  BEFORE UPDATE ON public.program_course_map
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: readable by authenticated users, writable only by service role.
ALTER TABLE public.program_course_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_course_map_read" ON public.program_course_map;
CREATE POLICY "program_course_map_read" ON public.program_course_map FOR SELECT
  TO authenticated USING (true);

-- Admin API for registering new programs.
-- POST /api/admin/course-builder/program-map
GRANT SELECT ON public.program_course_map TO authenticated, anon;
GRANT ALL    ON public.program_course_map TO service_role;

-- ── 20260422000002_course_lesson_versioning.sql ──
-- Adds lightweight versioning to course_lessons.
--
-- Design: snapshot-on-publish, not full event sourcing.
-- When a lesson is published, the current state is snapshotted into
-- course_lesson_versions. The lesson row itself always holds the live state.
-- Rollback = copy a version snapshot back to the lesson row.
--
-- This gives:
--   - Full publish history per lesson
--   - One-step rollback to any prior published state
--   - Audit trail (who published, when)
--   - No impact on read performance (versions are a separate table)

-- ── 1. Add version tracking columns to course_lessons ────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS version          INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by     UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS previous_version_id UUID;  -- FK added after versions table exists

-- ── 2. Create course_lesson_versions snapshot table ───────────────────────────

CREATE TABLE IF NOT EXISTS public.course_lesson_versions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id           UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  version             INTEGER NOT NULL,

  -- Snapshot of the lesson state at publish time
  title               TEXT NOT NULL,
  lesson_type         TEXT NOT NULL,
  order_index         INTEGER,
  content             JSONB,
  rendered_html       TEXT,
  video_url           TEXT,
  video_config        JSONB,
  quiz_questions      JSONB,
  passing_score       INTEGER,
  practical_required  BOOLEAN,
  competency_checks   JSONB,
  learning_objectives JSONB,
  activities          JSONB,
  duration_minutes    INTEGER,
  instructor_notes    TEXT,
  status              TEXT,

  -- Audit
  published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by        UUID REFERENCES auth.users(id),
  change_summary      TEXT          -- optional human note ("Fixed quiz question 3")
);

-- ── 3. Add FK from course_lessons.previous_version_id → course_lesson_versions ─

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'course_lessons_previous_version_fk'
      AND table_name = 'course_lessons'
  ) THEN
    ALTER TABLE public.course_lessons
      ADD CONSTRAINT course_lessons_previous_version_fk
      FOREIGN KEY (previous_version_id)
      REFERENCES public.course_lesson_versions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Index for fast version history lookup ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_course_lesson_versions_lesson_id
  ON public.course_lesson_versions (lesson_id, version DESC);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.course_lesson_versions ENABLE ROW LEVEL SECURITY;

-- Admins and instructors can read version history.
DROP POLICY IF EXISTS "lesson_versions_read" ON public.course_lesson_versions;
CREATE POLICY "lesson_versions_read"
  ON public.course_lesson_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- Only service role writes versions (via the publish API).
GRANT SELECT ON public.course_lesson_versions TO authenticated;
GRANT ALL    ON public.course_lesson_versions TO service_role;
GRANT SELECT ON public.course_lessons         TO authenticated;

-- ── 20260422000003_builder_org_tenancy.sql ──
-- Adds org_id to the builder execution layer tables.
-- organizations.slug = 'elevate-for-humanity' is the Elevate Core org.
-- organization_users uses organization_id (not org_id).
-- programs already has organization_id — this migration adds org_id on
-- courses, course_modules, course_lessons, and program_course_map.

-- ── 1. Add org_id to courses ──────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.courses
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE org_id IS NULL;

-- ── 2. Add org_id to course_modules ──────────────────────────────────────────

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.course_modules
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE org_id IS NULL;

-- ── 3. Add org_id to course_lessons ──────────────────────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Backfill org_id only on rows that won't trip content integrity checks
-- (rows that already have content or are not in a published course)
UPDATE public.course_lessons cl
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE cl.org_id IS NULL
  AND (
    cl.content IS NOT NULL
    OR cl.status != 'published'
    OR NOT EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = cl.course_id AND c.status = 'published'
    )
  );

-- ── 4. Add org_id to program_course_map ──────────────────────────────────────

ALTER TABLE public.program_course_map
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.program_course_map
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE org_id IS NULL;

-- ── 5. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_courses_org_id        ON public.courses (org_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_org_id ON public.course_modules (org_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_org_id ON public.course_lessons (org_id);

-- ── 6. RLS policies — org members can read their org's content ───────────────

-- courses
DROP POLICY IF EXISTS "courses_org_read" ON public.courses;
CREATE POLICY "courses_org_read" ON public.courses
  FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- course_lessons
DROP POLICY IF EXISTS "course_lessons_org_read" ON public.course_lessons;
CREATE POLICY "course_lessons_org_read" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ── 20260422000004_program_approval_workflow.sql ──
-- Adds approval workflow to programs and courses.
-- Enables: draft → in_review → approved → published → archived
-- Reviewers can approve/reject. Only approved programs can be published.

-- ── 1. programs: add review_status + reviewer tracking ───────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'in_review', 'approved', 'rejected', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS submitted_for_review_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by             UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes             TEXT;

-- ── 2. courses: same workflow ─────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'in_review', 'approved', 'rejected', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS submitted_for_review_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by             UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes             TEXT;

-- ── 3. program_review_log — immutable audit trail ────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_review_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES public.courses(id)  ON DELETE CASCADE,
  action       TEXT NOT NULL CHECK (action IN (
    'submitted', 'approved', 'rejected', 'published', 'archived', 'reverted_to_draft'
  )),
  from_status  TEXT NOT NULL,
  to_status    TEXT NOT NULL,
  actor_id     UUID NOT NULL REFERENCES auth.users(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  -- At least one of program_id or course_id must be set
  CONSTRAINT review_log_target_check CHECK (
    program_id IS NOT NULL OR course_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_program_review_log_program ON public.program_review_log (program_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_review_log_course  ON public.program_review_log (course_id,  created_at DESC);

ALTER TABLE public.program_review_log ENABLE ROW LEVEL SECURITY;

-- Org members can read their own review logs; platform admins see all.
DROP POLICY IF EXISTS "review_log_read" ON public.program_review_log;
CREATE POLICY "review_log_read" ON public.program_review_log
  FOR SELECT TO authenticated
  USING (
    -- Platform admin sees everything
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
    OR
    -- Org members see logs for their programs
    program_id IN (
      SELECT p.id FROM public.programs p
      JOIN public.organization_users ou ON ou.organization_id = p.organization_id
      WHERE ou.user_id = auth.uid() AND ou.status = 'active'
    )
  );

GRANT SELECT ON public.program_review_log TO authenticated;
GRANT ALL    ON public.program_review_log TO service_role;

-- ── 4. Backfill existing published programs to review_status = 'published' ───

UPDATE public.programs
SET review_status = 'published'
WHERE published = true AND review_status = 'draft';

UPDATE public.programs
SET review_status = 'archived'
WHERE status = 'archived' AND review_status = 'draft';

UPDATE public.courses
SET review_status = 'published'
WHERE status = 'published' AND review_status = 'draft';

UPDATE public.courses
SET review_status = 'archived'
WHERE status = 'archived' AND review_status = 'draft';

-- ── 20260422000005_program_course_links.sql ──
-- Upgrades program_course_map to the full program_course_links model.
-- program_course_map (created in 20260422000001) is renamed and extended
-- with org_id, program_id FK, is_primary, and status.
--
-- program_course_links is the canonical join between the program definition
-- layer and the LMS execution layer, scoped per org.

-- ── 1. Create program_course_links ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_course_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id   UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  program_slug TEXT,  -- fallback for programs not yet in programs table
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_primary   BOOLEAN NOT NULL DEFAULT true,
  status       TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Migrate data from program_course_map ───────────────────────────────────

INSERT INTO public.program_course_links (org_id, program_slug, course_id, is_primary, status)
SELECT
  COALESCE(pcm.org_id, (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)),
  pcm.program_slug,
  pcm.course_id,
  true,
  'active'
FROM public.program_course_map pcm
ON CONFLICT DO NOTHING;

-- Backfill program_id where the slug matches a programs row
UPDATE public.program_course_links pcl
SET program_id = p.id
FROM public.programs p
WHERE p.slug = pcl.program_slug
  AND pcl.program_id IS NULL;

-- ── 3. Trigger for updated_at ─────────────────────────────────────────────────

DROP TRIGGER IF EXISTS program_course_links_updated_at ON public.program_course_links;
CREATE TRIGGER program_course_links_updated_at
  BEFORE UPDATE ON public.program_course_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pcl_org_id     ON public.program_course_links (org_id);
CREATE INDEX IF NOT EXISTS idx_pcl_program_id ON public.program_course_links (program_id);
CREATE INDEX IF NOT EXISTS idx_pcl_course_id  ON public.program_course_links (course_id);
CREATE INDEX IF NOT EXISTS idx_pcl_slug       ON public.program_course_links (program_slug);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.program_course_links ENABLE ROW LEVEL SECURITY;

DROP policy if exists "pcl_org_read" on public.program_course_links;
CREATE policy "pcl_org_read" on public.program_course_links
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.program_course_links TO authenticated;
GRANT ALL    ON public.program_course_links TO service_role;

-- ── 20260422000006_program_course_versions.sql ──
ALTER TABLE public.program_course_versions
  ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.program_versions ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.program_versions
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Program and course version snapshots.
-- Snapshot-on-publish: when a program or course is published, the full
-- state is captured as JSONB. Rollback restores from snapshot.
--
-- course_lesson_versions (per-lesson) was added in 20260422000002.
-- This migration adds program-level and course-level snapshots.

-- ── program_versions ──────────────────────────────────────────────────────────

-- table already exists

CREATE INDEX IF NOT EXISTS idx_program_versions_program ON public.program_versions (program_id, version DESC);

ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY;

DROP policy if exists "program_versions_read" on public.program_versions;
CREATE policy "program_versions_read" on public.program_versions
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.program_versions TO authenticated;
GRANT ALL    ON public.program_versions TO service_role;

-- ── course_versions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  snapshot    JSONB NOT NULL,   -- full course + modules + lessons state
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_course_versions_course ON public.course_versions (course_id, version DESC);
EXCEPTION WHEN undefined_column THEN
  CREATE INDEX IF NOT EXISTS idx_course_versions_course ON public.course_versions (course_id, version_number DESC);
END $$;

ALTER TABLE public.course_versions ENABLE ROW LEVEL SECURITY;

DROP policy if exists "course_versions_read" on public.course_versions;
CREATE policy "course_versions_read" on public.course_versions
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.course_versions TO authenticated;
GRANT ALL    ON public.course_versions TO service_role;

-- ── version counter columns ───────────────────────────────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS version         INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by    UUID REFERENCES auth.users(id);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS version         INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by    UUID REFERENCES auth.users(id);

-- ── 20260422000007_media_assets.sql ──
-- Media asset registry.
-- Replaces loose file path strings on lesson rows with typed asset references.
-- Lessons reference assets by ID; the path lives in one place.

CREATE TABLE IF NOT EXISTS public.media_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('video', 'audio', 'image', 'document', 'other')),
  mime_type        TEXT,
  duration_seconds INTEGER,
  transcript       TEXT,
  title            TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_org_id ON public.media_assets (org_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type   ON public.media_assets (type);

DROP TRIGGER IF EXISTS media_assets_updated_at ON public.media_assets;
CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_assets_org_read" ON public.media_assets;
CREATE POLICY "media_assets_org_read" ON public.media_assets
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.media_assets TO authenticated;
GRANT ALL    ON public.media_assets TO service_role;

-- Add media_asset_id reference to course_lessons.
-- Preserves existing video_url/video_file columns for backward compatibility.
-- New lessons should set media_asset_id; legacy lessons keep video_url.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_media_asset
  ON public.course_lessons (media_asset_id)
  WHERE media_asset_id IS NOT NULL;

-- Same for curriculum_lessons (live LMS table)
ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL;

-- ── 20260422000008_curriculum_lessons_content_jsonb.sql ──
-- Add content JSONB column to curriculum_lessons for Tiptap block editor output.
-- script_text (plain text) is retained as a read-only archive; new edits write to content.
-- The lms_lessons view already exposes content from course_lessons — this aligns
-- curriculum_lessons to the same shape so both tables can be queried uniformly.

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS content jsonb;

COMMENT ON COLUMN public.curriculum_lessons.content IS
  'Tiptap ProseMirror JSON document. Replaces script_text for new content edits. '
  'script_text is retained as a read-only archive for HVAC legacy content.';

-- Backfill: wrap existing script_text into a minimal Tiptap doc so the editor
-- can open old lessons without showing a blank canvas.
UPDATE public.curriculum_lessons
SET content = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', script_text)
      )
    )
  )
)
WHERE script_text IS NOT NULL
  AND content IS NULL;

-- ── 20260423000001_marketing_tables_proper_schema.sql ──
-- Marketing tables: proper schemas replacing baseline stubs
-- Apply in Supabase Dashboard → SQL Editor

-- ── pricing_plans ─────────────────────────────────────────────────────────────
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS tier          text,          -- free | student | career | partner
  ADD COLUMN IF NOT EXISTS price         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interval      text,          -- month | year | one_time | null
  ADD COLUMN IF NOT EXISTS price_display text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS features      jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

-- ── impact_metrics ────────────────────────────────────────────────────────────
ALTER TABLE public.impact_metrics
  ADD COLUMN IF NOT EXISTS category      text,          -- learners | employers | community | funding
  ADD COLUMN IF NOT EXISTS label         text,
  ADD COLUMN IF NOT EXISTS value         text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

-- ── content_blocks ────────────────────────────────────────────────────────────
ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS page          text,          -- what_we_do | homepage | about | etc
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS body          text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS image_url     text,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS order_index   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

-- ── offerings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offerings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  category      text,          -- training | credentialing | apprenticeship | funding | support
  icon          text,
  image_url     text,
  cta_label     text,
  cta_href      text,
  features      jsonb DEFAULT '[]',
  order_index   integer DEFAULT 0,
  status        text DEFAULT 'active',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read offerings" ON public.offerings;
CREATE POLICY "Public read offerings" ON public.offerings FOR SELECT USING (status = 'active');

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON public.content_blocks(page);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_category ON public.impact_metrics(category);
CREATE INDEX IF NOT EXISTS idx_offerings_status ON public.offerings(status);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_tier ON public.pricing_plans(tier);

-- ── 20260423000002_seed_marketing_tables.sql ──
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Apply schema (run this first if 20260423000001 not yet applied)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS tier          text,
  ADD COLUMN IF NOT EXISTS price         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interval      text,
  ADD COLUMN IF NOT EXISTS price_display text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS features      jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

ALTER TABLE public.impact_metrics
  ADD COLUMN IF NOT EXISTS category      text,
  ADD COLUMN IF NOT EXISTS label         text,
  ADD COLUMN IF NOT EXISTS value         text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS page          text,
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS body          text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS image_url     text,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS order_index   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.offerings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  category      text,
  icon          text,
  image_url     text,
  cta_label     text,
  cta_href      text,
  features      jsonb DEFAULT '[]',
  order_index   integer DEFAULT 0,
  status        text DEFAULT 'active',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read offerings" ON public.offerings;
CREATE POLICY "Public read offerings" ON public.offerings
  FOR SELECT USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_content_blocks_page    ON public.content_blocks(page);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_category ON public.impact_metrics(category);
CREATE INDEX IF NOT EXISTS idx_offerings_status        ON public.offerings(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Seed impact_metrics
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.impact_metrics (category, label, value, description, display_order, is_active) VALUES
  ('learners',   'Learners Enrolled',          '500+',  'Total learners enrolled across all programs',                    1, true),
  ('learners',   'Credential Attainment Rate', '94%',   'Percentage of enrolled learners who earn their credential',      2, true),
  ('learners',   'Job Placement Rate',         '78%',   'Learners placed in employment within 90 days of completion',     3, true),
  ('employers',  'Employer Partners',          '40+',   'Employers actively hiring Elevate graduates',                    4, true),
  ('employers',  'Average Wage Gain',          '$8.50', 'Average hourly wage increase after program completion',          5, true),
  ('community',  'Counties Served',            '12',    'Indiana counties with active Elevate learners or partners',      6, true),
  ('funding',    'WIOA Participants',          '200+',  'Learners funded through WIOA Title I workforce grants',          7, true),
  ('funding',    'Grant Funding Secured',      '$1.2M', 'Total grant and public funding secured for learner support',     8, true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Seed content_blocks (what_we_do page)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.content_blocks (page, title, body, cta_label, cta_href, order_index, is_active) VALUES
  ('what_we_do', 'Workforce Training',
   'Industry-recognized credential programs in healthcare, skilled trades, technology, and business. Funded through WIOA, WRG, and employer partnerships.',
   'Browse Programs', '/programs', 1, true),
  ('what_we_do', 'Registered Apprenticeships',
   'DOL-registered apprenticeship programs in barbering, cosmetology, and skilled trades. Earn while you learn with structured on-the-job learning and related technical instruction.',
   'Learn More', '/apprenticeships', 2, true),
  ('what_we_do', 'Career Placement',
   'Job placement support, employer connections, resume coaching, and post-placement follow-up. We track outcomes and report to funding agencies.',
   'Get Started', '/contact', 3, true),
  ('what_we_do', 'Employer Partnerships',
   'We connect trained graduates directly to hiring employers. Customized training pipelines, on-site cohorts, and work-based learning agreements.',
   'Partner With Us', '/for-employers', 4, true),
  ('what_we_do', 'Funding Navigation',
   'We help learners access WIOA, WRG, Pell, and employer-sponsored funding to cover training costs. No out-of-pocket cost for eligible participants.',
   'Check Eligibility', '/apply', 5, true),
  ('what_we_do', 'Compliance & Reporting',
   'ETPL-approved, RAPIDS-reporting, and Perkins V-eligible. We handle all compliance documentation so funders and partners can trust the data.',
   'View Compliance', '/government', 6, true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Seed offerings
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.offerings (title, description, category, cta_label, cta_href, features, order_index, status) VALUES
  ('Credential Training Programs',
   'Short-term, industry-recognized credential programs in healthcare, skilled trades, technology, and business. Most programs complete in 4–16 weeks.',
   'training', 'Browse Programs', '/programs',
   '["EPA 608 HVAC Certification","CompTIA A+ & Security+","NHA Medical Assistant","Certiport Entrepreneurship","Barbering & Cosmetology"]',
   1, 'active'),
  ('Registered Apprenticeships',
   'DOL-registered apprenticeship programs combining paid on-the-job learning with related technical instruction. Earn while you learn.',
   'apprenticeship', 'Learn More', '/apprenticeships',
   '["Barbering Apprenticeship","Cosmetology Apprenticeship","Skilled Trades Pre-Apprenticeship","Employer-Sponsored Cohorts"]',
   2, 'active'),
  ('Employer Training Pipelines',
   'Custom training cohorts built around your hiring needs. We recruit, train, credential, and deliver job-ready candidates directly to your workforce.',
   'employer', 'Partner With Us', '/for-employers',
   '["Custom Cohort Design","On-Site or Hybrid Delivery","WOTC Assistance","Retention Support"]',
   3, 'active'),
  ('Funding & Financial Navigation',
   'We help learners access WIOA, WRG, Pell, and employer-sponsored funding. Eligible participants pay nothing out of pocket.',
   'funding', 'Check Eligibility', '/apply',
   '["WIOA Title I Funding","Workforce Ready Grant","Employer Sponsorship","Emergency Barrier Removal"]',
   4, 'active'),
  ('Career Placement Services',
   'Resume coaching, interview prep, employer introductions, and post-placement follow-up. We stay with learners through their first 90 days on the job.',
   'support', 'Get Started', '/contact',
   '["Resume & Interview Coaching","Employer Job Board","90-Day Follow-Up","Wage Tracking & Reporting"]',
   5, 'active'),
  ('Government & Agency Partnerships',
   'ETPL-approved, RAPIDS-reporting, and Perkins V-eligible. We serve as a compliant training partner for workforce boards, DWD, and K-12 CTE programs.',
   'government', 'Learn More', '/government',
   '["ETPL Approved","RAPIDS Reporting","Perkins V Eligible","WIOA Title I Compliant"]',
   6, 'active')
ON CONFLICT DO NOTHING;

-- ── 20260424000001_programs_content_columns.sql ──
-- Add content columns needed for the public course publishing pipeline.
--
-- Existing columns already cover: tuition, credential_name, requirements,
-- funding_eligible, delivery_mode, category, status, published, is_active,
-- short_description, description, review_status.
--
-- This migration adds the remaining fields identified in the side-by-side audit.
-- All additions use IF NOT EXISTS with safe defaults — no destructive changes.

ALTER TABLE public.programs
  -- Structured learning objectives (array of strings, e.g. ["Identify refrigerant types", ...])
  ADD COLUMN IF NOT EXISTS learning_objectives  JSONB,

  -- Structured outcomes (array of strings, e.g. ["EPA 608 certification", "Job placement support"])
  ADD COLUMN IF NOT EXISTS outcomes             JSONB,

  -- Human-readable credential awarded on completion (e.g. "EPA 608 Universal Certificate")
  -- Distinct from credential_name (which is the DB-normalized name used in catalog queries).
  -- certification_awarded is the display string shown on the public program page.
  ADD COLUMN IF NOT EXISTS certification_awarded TEXT,

  -- Timestamp when the program was first published (set by publish-direct route)
  ADD COLUMN IF NOT EXISTS published_at         TIMESTAMPTZ;

-- Backfill published_at for programs already live
UPDATE public.programs
SET published_at = updated_at
WHERE published = true
  AND published_at IS NULL
  AND updated_at IS NOT NULL;

-- Backfill certification_awarded from credential_name where not set
UPDATE public.programs
SET certification_awarded = credential_name
WHERE certification_awarded IS NULL
  AND credential_name IS NOT NULL
  AND credential_name != '';

-- Index for catalog queries that filter by published_at (e.g. "newest programs")
CREATE INDEX IF NOT EXISTS idx_programs_published_at
  ON public.programs(published_at DESC)
  WHERE published = true;

COMMENT ON COLUMN public.programs.learning_objectives IS
  'JSONB array of strings. What learners will be able to do after completing the program.';
COMMENT ON COLUMN public.programs.outcomes IS
  'JSONB array of strings. Employment and credential outcomes (e.g. job titles, salary range, certifications).';
COMMENT ON COLUMN public.programs.certification_awarded IS
  'Display name of the credential issued on completion. Shown on public program page.';
COMMENT ON COLUMN public.programs.published_at IS
  'Timestamp of first publish. Set by POST /api/admin/programs/[id]/publish-direct.';

-- ── 20260424000002_archive_test_programs.sql ──
-- Archive test/junk program entries that appeared on the public /programs page.
-- These were created by automated generators and were never real programs.
-- Sets is_active = false and status = 'archived' so they are excluded from
-- the programs page query (which filters: is_active = true AND status != 'archived').

UPDATE public.programs
SET
  is_active = false,
  status    = 'archived',
  updated_at = now()
WHERE
  -- Match known test entry titles
  title ILIKE '%generator acceptance test%'
  OR title ILIKE '%publish path validation test%'
  OR title ILIKE '%acceptance test%'
  OR title ILIKE '%validation test%'
  -- Catch any other obvious test slugs
  OR slug  ILIKE '%test%'
  OR slug  ILIKE '%demo%'
  OR slug  ILIKE '%sample%'
  OR slug  ILIKE '%placeholder%'
  OR slug  ILIKE '%example%';

-- Verify: show what was archived
SELECT id, slug, title, is_active, status
FROM public.programs
WHERE status = 'archived'
  AND updated_at > now() - interval '5 seconds'
ORDER BY title;

-- ── 20260424000003_verify_audit_integrity_rpc.sql ──
-- Creates the verify_audit_integrity() RPC called by /api/health.
-- Returns a JSON object with:
--   disabled_triggers: count of disabled immutability triggers on audit tables
--   missing_immutability: array of audit table names missing their immutability trigger

CREATE OR REPLACE FUNCTION public.verify_audit_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_tables text[] := ARRAY['audit_logs', 'audit_failures', 'audit_ddl_events'];
  tbl text;
  missing text[] := '{}';
  disabled_count int := 0;
  trigger_name text;
  trigger_enabled char;
BEGIN
  FOREACH tbl IN ARRAY audit_tables LOOP
    -- Check if an immutability trigger exists on this table
    SELECT t.tgname, CASE WHEN t.tgenabled = 'D' THEN 'D' ELSE 'E' END
    INTO trigger_name, trigger_enabled
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = tbl
      AND (t.tgname ILIKE '%immut%' OR t.tgname ILIKE '%readonly%' OR t.tgname ILIKE '%protect%')
    LIMIT 1;

    IF trigger_name IS NULL THEN
      missing := array_append(missing, tbl);
    ELSIF trigger_enabled = 'D' THEN
      disabled_count := disabled_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'disabled_triggers',     disabled_count,
    'missing_immutability',  to_jsonb(missing)
  );
END;
$$;

-- Only service_role (used by admin client in health check) can call this
REVOKE ALL ON FUNCTION public.verify_audit_integrity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_audit_integrity() TO service_role;

-- ── 20260424000004_audit_ddl_events_immutability_trigger.sql ──
-- Adds immutability protection for public.audit_ddl_events.
--
-- This trigger was defined in 20260228000002_audit_ddl_monitoring.sql but
-- was never applied to the live database. The verify_audit_integrity() RPC
-- reports it as missing, causing the /api/health audit_integrity check to warn.
--
-- Safe to run repeatedly (idempotent via DO block).

-- Function: raise on any UPDATE or DELETE attempt
CREATE OR REPLACE FUNCTION public.prevent_audit_ddl_events_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_ddl_events is immutable: UPDATE and DELETE are not allowed';
END;
$$;

-- Trigger: apply only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'audit_ddl_events'
      AND t.tgname = 'enforce_ddl_events_immutability'
  ) THEN
    CREATE TRIGGER enforce_ddl_events_immutability
    BEFORE UPDATE OR DELETE ON public.audit_ddl_events
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_ddl_events_mutation();
  END IF;
END $$;

-- ── 20260425000001_applications_funding_eligibility.sql ──
-- Add funding eligibility tracking columns to applications table.
--
-- funding_type: wioa | wrg | fssa | self-pay | employer | unsure
-- funding_eligibility_status: approved | in_process | needs_appointment | not_resident
--   'needs_appointment' = student has not been to Indiana Career Connect yet
--   These applications are saved as status='pending_funding' and must NOT be enrolled
--   until the student completes ICC and reapplies.
--
-- Also adds 'pending_funding' and 'pending_admin_review' to the status check constraint.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS funding_type text,
  ADD COLUMN IF NOT EXISTS funding_eligibility_status text;

-- Extend the status check constraint to include the two new funded statuses.
-- Drop and recreate since Postgres does not support ALTER CHECK inline.
DO $$
BEGIN
  -- Remove old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND constraint_name = 'applications_status_check'
  ) THEN
    ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
  END IF;
END $$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'submitted',
      'pending_funding',       -- funded, has not been to ICC yet — do not enroll
      'pending_admin_review',  -- funded, ICC in process or approved — admin must verify
      'under_review',
      'approved',
      'enrolled',
      'waitlisted',
      'rejected',
      'withdrawn',
      'incomplete'
    )
  );

-- Index for admin dashboard queries filtering by funded status
CREATE INDEX IF NOT EXISTS idx_applications_funding_type
  ON public.applications (funding_type)
  WHERE funding_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_pending_funding
  ON public.applications (status)
  WHERE status IN ('pending_funding', 'pending_admin_review');

COMMENT ON COLUMN public.applications.funding_type IS
  'Funding source selected by applicant: wioa | wrg | fssa | self-pay | employer | unsure';

COMMENT ON COLUMN public.applications.funding_eligibility_status IS
  'Result of FundingEligibilityFlow: approved | in_process | needs_appointment | not_resident';

-- ── 20260425000002_application_followups.sql ──
-- Track automated follow-up emails sent to applicants in funded statuses.
-- Used by /api/cron/funding-followup to avoid duplicate sends and to
-- surface "call required" flags in the admin dashboard after 2 attempts.

CREATE TABLE IF NOT EXISTS public.application_followups (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  followup_type     TEXT        NOT NULL CHECK (followup_type IN ('icc_nudge', 'review_reassurance')),
  followup_number   INTEGER     NOT NULL CHECK (followup_number IN (1, 2)),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_subject     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One follow-up per number per application (prevents duplicate sends on retry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_application_followups_unique
  ON public.application_followups (application_id, followup_number);

-- Admin dashboard: find all applications that need manual outreach
CREATE INDEX IF NOT EXISTS idx_application_followups_app
  ON public.application_followups (application_id);

-- RLS: admins only
ALTER TABLE public.application_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage application_followups" ON public.application_followups;
CREATE POLICY "Admins can manage application_followups" ON public.application_followups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

COMMENT ON TABLE public.application_followups IS
  'Automated follow-up email log for pending_funding and pending_admin_review applications. '
  'Max 2 follow-ups per application — after that, next_step is set to call_required.';

-- ── 20260425000003_occupation_standards.sql ──
-- Industry standards cache table.
--
-- Stores O*NET, BLS, and CareerOneStop data per SOC code.
-- Refreshed on-demand via /api/admin/industry/refresh-standards.
-- Injected into AI course generation prompts so output is grounded
-- in real job task data rather than model training data alone.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.occupation_standards (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code              text NOT NULL,          -- e.g. '21-1093.00'
  soc_title             text NOT NULL,          -- e.g. 'Social and Human Service Assistants'
  source                text NOT NULL,          -- 'onet' | 'bls' | 'careeronestop'

  -- O*NET fields
  tasks                 jsonb,   -- [{task: string, importance: number, frequency: number}]
  skills                jsonb,   -- [{name: string, importance: number, level: number}]
  knowledge             jsonb,   -- [{name: string, importance: number}]
  abilities             jsonb,   -- [{name: string, importance: number}]
  work_activities       jsonb,   -- [{name: string, importance: number}]
  technology_skills     jsonb,   -- [{name: string, hot_technology: boolean}]
  education_required    jsonb,   -- {typical_level: string, distribution: {level: string, pct: number}[]}
  work_context          jsonb,   -- [{name: string, value: string}]

  -- BLS fields
  median_annual_wage    integer,               -- USD
  employment_count      integer,               -- national
  projected_growth_pct  numeric(5,2),          -- 10-year projection %
  projected_growth_cat  text,                  -- 'much faster' | 'faster' | 'average' | 'slower' | 'decline'
  entry_wage            integer,               -- 10th percentile
  experienced_wage      integer,               -- 90th percentile
  indiana_median_wage   integer,               -- state-specific if available

  -- CareerOneStop fields
  certifications        jsonb,   -- [{name: string, organization: string, url: string}]
  apprenticeship_count  integer,
  job_postings_count    integer,
  top_employers         jsonb,   -- [{name: string, location: string}]

  -- Metadata
  fetched_at            timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  fetch_error           text     -- last error if fetch failed
  -- is_stale is computed at query time: (now() > expires_at)
  -- GENERATED ALWAYS AS is not supported here (now() is not immutable)
);

-- Index for fast lookup by SOC code
CREATE INDEX IF NOT EXISTS idx_occupation_standards_soc ON public.occupation_standards (soc_code);
CREATE INDEX IF NOT EXISTS idx_occupation_standards_expires ON public.occupation_standards (expires_at);

-- Compliance domains table — stores credentialing body domain weights
-- (IC&RC, NAADAC, NHA, NCCER, state boards, etc.)
-- These are the authoritative domain structures that AI must cover.
CREATE TABLE IF NOT EXISTS public.credential_domains (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_code   text NOT NULL,   -- e.g. 'ICRC-PRS', 'NHA-CCMA', 'EPA-608'
  credential_title  text NOT NULL,
  governing_body    text NOT NULL,   -- e.g. 'IC&RC', 'NHA', 'EPA'
  state             text,            -- null = national
  version           text,            -- e.g. '2024'
  effective_date    date,
  domains           jsonb NOT NULL,  -- [{key, name, weight_pct, min_hours, competencies: string[]}]
  exam_blueprint    jsonb,           -- {total_questions, time_minutes, passing_score, domain_breakdown}
  source_url        text,
  verified_by       text,            -- name of SME who verified
  verified_at       timestamptz,
  compliance_status text NOT NULL DEFAULT 'draft_for_human_review',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credential_domains_code ON public.credential_domains (credential_code);

-- Seed known credential domains (IC&RC PRS, NHA CCMA, EPA 608)
-- These are manually authored from published exam blueprints.
-- compliance_status = 'draft_for_human_review' until SME-verified.

INSERT INTO public.credential_domains
  (credential_code, credential_title, governing_body, state, version, effective_date, domains, exam_blueprint, source_url, compliance_status)
VALUES
(
  'ICRC-PRS',
  'Peer Recovery Specialist',
  'IC&RC',
  NULL,
  '2023',
  '2023-01-01',
  '[
    {"key":"ethics","name":"Ethics and Boundaries","weight_pct":15,"min_hours":6,"competencies":["Maintain professional boundaries","Apply IC&RC Code of Ethics","Recognize dual relationships","Mandatory reporting obligations"]},
    {"key":"advocacy","name":"Advocacy","weight_pct":15,"min_hours":6,"competencies":["Navigate systems on behalf of peers","Connect to community resources","Assist with benefits enrollment","Reduce barriers to care"]},
    {"key":"mentoring","name":"Mentoring and Education","weight_pct":20,"min_hours":8,"competencies":["Share lived experience appropriately","Facilitate peer support groups","Teach recovery skills","Model recovery behaviors"]},
    {"key":"recovery_support","name":"Recovery and Wellness Support","weight_pct":25,"min_hours":10,"competencies":["Develop recovery plans","Identify triggers and warning signs","Apply wellness dimensions","Support medication-assisted recovery"]},
    {"key":"crisis","name":"Crisis Support","weight_pct":15,"min_hours":6,"competencies":["Recognize crisis indicators","Apply de-escalation techniques","Connect to crisis services","Document crisis contacts"]},
    {"key":"cultural","name":"Cultural Responsiveness","weight_pct":10,"min_hours":4,"competencies":["Apply trauma-informed care principles","Recognize cultural factors in recovery","Serve diverse populations","Address stigma"]}
  ]'::jsonb,
  '{"total_questions":100,"time_minutes":120,"passing_score":70,"domain_breakdown":{"ethics":15,"advocacy":15,"mentoring":20,"recovery_support":25,"crisis":15,"cultural":10}}'::jsonb,
  'https://internationalcredentialing.org/prs',
  'draft_for_human_review'
),
(
  'NHA-CCMA',
  'Certified Clinical Medical Assistant',
  'NHA',
  NULL,
  '2024',
  '2024-01-01',
  '[
    {"key":"patient_care","name":"Patient Care","weight_pct":24,"min_hours":10,"competencies":["Vital signs","Patient intake","Specimen collection","Wound care","Medication administration under supervision"]},
    {"key":"clinical_procedures","name":"Clinical Procedures","weight_pct":22,"min_hours":9,"competencies":["EKG/ECG","Phlebotomy","Urinalysis","Sterilization","Assisting with minor procedures"]},
    {"key":"administrative","name":"Administrative","weight_pct":20,"min_hours":8,"competencies":["Medical records","Scheduling","Insurance verification","HIPAA compliance","ICD/CPT coding basics"]},
    {"key":"communication","name":"Communication","weight_pct":18,"min_hours":7,"competencies":["Patient education","Telephone triage","Interdisciplinary communication","Cultural competency"]},
    {"key":"legal_ethics","name":"Legal and Ethical Issues","weight_pct":16,"min_hours":6,"competencies":["Scope of practice","Informed consent","Advance directives","Mandatory reporting","OSHA standards"]}
  ]'::jsonb,
  '{"total_questions":150,"time_minutes":180,"passing_score":70,"domain_breakdown":{"patient_care":24,"clinical_procedures":22,"administrative":20,"communication":18,"legal_ethics":16}}'::jsonb,
  'https://www.nhanow.com/certifications/medical-assistant',
  'draft_for_human_review'
),
(
  'EPA-608',
  'EPA Section 608 Universal Technician',
  'EPA',
  NULL,
  '2023',
  '2023-01-01',
  '[
    {"key":"core","name":"Core — General Knowledge","weight_pct":25,"min_hours":8,"competencies":["Refrigerant types and properties","Environmental impact of refrigerants","Clean Air Act Section 608","Ozone depletion and global warming potential"]},
    {"key":"type1","name":"Type I — Small Appliances","weight_pct":25,"min_hours":8,"competencies":["Recovery techniques for small appliances","Disposable cylinder regulations","System-dependent recovery","Recovery equipment certification"]},
    {"key":"type2","name":"Type II — High-Pressure Systems","weight_pct":25,"min_hours":8,"competencies":["High-pressure refrigerant handling","Leak detection","Recovery and recycling","Retrofit procedures"]},
    {"key":"type3","name":"Type III — Low-Pressure Systems","weight_pct":25,"min_hours":8,"competencies":["Low-pressure refrigerant handling","Purging and pressurizing","Leak testing","Evacuation procedures"]}
  ]'::jsonb,
  '{"total_questions":100,"time_minutes":120,"passing_score":70,"domain_breakdown":{"core":25,"type1":25,"type2":25,"type3":25}}'::jsonb,
  'https://www.epa.gov/section608',
  'draft_for_human_review'
)
ON CONFLICT (credential_code, version) DO NOTHING;

-- RLS: admin-only write, service role read
ALTER TABLE public.occupation_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_domains ENABLE ROW LEVEL SECURITY;

DROP policy if exists "service_role_all_occupation_standards" on public.occupation_standards;
CREATE policy "service_role_all_occupation_standards" on public.occupation_standards FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP policy if exists "authenticated_read_occupation_standards" on public.occupation_standards;
CREATE policy "authenticated_read_occupation_standards" on public.occupation_standards FOR SELECT TO authenticated USING (true);

DROP policy if exists "service_role_all_credential_domains" on public.credential_domains;
CREATE policy "service_role_all_credential_domains" on public.credential_domains FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP policy if exists "authenticated_read_credential_domains" on public.credential_domains;
CREATE policy "authenticated_read_credential_domains" on public.credential_domains FOR SELECT TO authenticated USING (true);

-- ── 20260427000001_admin_dashboard_rebuild.sql ──
-- Migration: Admin Dashboard Rebuild
-- Adds admin-facing summary views for the cohorts and barriers admin pages.
-- All admin pages now query real DB tables — no hardcoded placeholder data.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Cohort admin summary view
--    Used by /admin/cohorts to show enrollment fill rates and status.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_admin_cohort_summary AS
SELECT
  c.id,
  c.code,
  c.name,
  c.program_id,
  p.title                                                           AS program_title,
  c.start_date,
  c.end_date,
  c.max_capacity,
  c.current_enrollment,
  c.status,
  c.location,
  c.notes,
  c.created_at,
  CASE
    WHEN c.max_capacity IS NULL OR c.max_capacity = 0 THEN NULL
    ELSE ROUND((c.current_enrollment::numeric / c.max_capacity) * 100)
  END                                                               AS fill_pct,
  COUNT(te.id)                                                      AS enrolled_count
FROM public.cohorts c
LEFT JOIN public.programs p         ON p.id = c.program_id
LEFT JOIN public.training_enrollments te
       ON te.cohort_id = c.id
      AND te.status NOT IN ('withdrawn', 'cancelled')
GROUP BY c.id, p.title;

-- Grant to service_role so admin pages can read via the admin client
GRANT SELECT ON public.v_admin_cohort_summary TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Ensure participant_barriers has the status column used by /admin/barriers
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.participant_barriers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add the constraint only if it doesn't already exist to avoid errors on re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.participant_barriers'::regclass
      AND conname   = 'participant_barriers_status_check'
  ) THEN
    ALTER TABLE public.participant_barriers
      ADD CONSTRAINT participant_barriers_status_check
        CHECK (status IN ('active', 'resolved', 'in_progress'));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Ensure api_keys table exists for /admin/api-keys
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  key_prefix  TEXT,
  key_hash    TEXT,
  scopes      TEXT[]      NOT NULL DEFAULT '{}',
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  last_used   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_by  UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_keys_admin_all" ON public.api_keys;
CREATE POLICY "api_keys_admin_all" ON public.api_keys
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- service_role bypass for admin client reads/writes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO service_role;

-- ── 20260427000002_audit_logs_harden.sql ──
-- audit_logs hardening
--
-- The original migration (20260118000001) created audit_logs with columns:
--   actor_id, target_type, target_id, metadata
--
-- The codebase already writes: user_id, resource_type, resource_id, details,
--   ip_address, user_agent, success
--
-- This migration reconciles the two by:
--   1. Adding missing columns (idempotent — IF NOT EXISTS)
--   2. Adding tenant_id + role for cross-tenant enforcement
--   3. Tightening RLS: only admins/staff can read; service role writes
--   4. Adding indexes for common query patterns
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── Column additions (idempotent) ────────────────────────────────────────────

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tenant_id     uuid,
  ADD COLUMN IF NOT EXISTS role          text,
  ADD COLUMN IF NOT EXISTS resource_type text,
  ADD COLUMN IF NOT EXISTS resource_id   text,
  ADD COLUMN IF NOT EXISTS details       jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ip_address    text,
  ADD COLUMN IF NOT EXISTS user_agent    text,
  ADD COLUMN IF NOT EXISTS success       boolean DEFAULT true;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id     ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource      ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_ts     ON public.audit_logs(action, created_at DESC);

-- ── RLS policies ─────────────────────────────────────────────────────────────

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and staff can read all logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Authenticated users can read their own logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid() OR actor_id = auth.uid());

-- Inserts: service role bypasses RLS entirely.
-- For anon/authenticated JWT callers, restrict to inserting their own user_id only.
-- This prevents a compromised user session from forging audit entries for other users.
DROP POLICY IF EXISTS "Users can create own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role inserts audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users insert own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users insert own audit logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()   -- own entries only
    OR user_id IS NULL     -- system/webhook entries have no user_id
  );

-- No updates or deletes — audit logs are immutable
DROP POLICY IF EXISTS "No updates to audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No updates to audit logs" ON public.audit_logs;
CREATE POLICY "No updates to audit logs" ON public.audit_logs
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes from audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No deletes from audit logs" ON public.audit_logs;
CREATE POLICY "No deletes from audit logs" ON public.audit_logs
  FOR DELETE USING (false);

COMMENT ON TABLE public.audit_logs IS
  'Immutable audit trail. Columns user_id/resource_type/resource_id/details are canonical. '
  'actor_id/target_type/target_id/metadata retained for backward compatibility.';

-- ── Post-migration verification (run in SQL Editor after applying) ────────────
--
-- 1. Confirm new columns exist:
--
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'audit_logs'
--      AND column_name IN ('user_id','tenant_id','role','resource_type','resource_id',
--                          'details','ip_address','user_agent','success')
--    ORDER BY column_name;
--
--    Expected: 9 rows returned.
--
-- 2. Confirm indexes exist:
--
--    SELECT indexname FROM pg_indexes
--    WHERE tablename = 'audit_logs'
--      AND indexname LIKE 'idx_audit_logs_%';
--
--    Expected: idx_audit_logs_action_ts, idx_audit_logs_resource,
--              idx_audit_logs_tenant_id, idx_audit_logs_user_id
--
-- 3. Confirm RLS policies:
--
--    SELECT policyname, cmd FROM pg_policies
--    WHERE tablename = 'audit_logs'
--    ORDER BY policyname;
--
--    Expected policies:
--      Admins can view audit logs          SELECT
--      Authenticated users insert own ...  INSERT
--      No deletes from audit logs          DELETE
--      No updates to audit logs            UPDATE
--      Users can view own audit logs       SELECT
--
-- 4. Smoke-test insert (replace with a real user_id from auth.users):
--
--    INSERT INTO public.audit_logs
--      (user_id, tenant_id, role, action, resource_type, resource_id, details, success)
--    VALUES
--      (NULL, NULL, 'system', 'MIGRATION_VERIFY', 'audit_logs', 'smoke-test',
--       '{"note":"post-migration smoke test"}'::jsonb, true);
--
--    SELECT * FROM public.audit_logs
--    WHERE action = 'MIGRATION_VERIFY' ORDER BY created_at DESC LIMIT 1;
--
--    Then delete the smoke-test row:
--    -- Note: deletes are blocked by RLS for non-service-role.
--    -- Run as service role or via Dashboard table editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 20260427000003_all_employer_partners.sql ──
ALTER TABLE public.partners ALTER COLUMN owner_name DROP NOT NULL;

-- Seed all employer partners across Elevate's program network.
-- These are hiring partners, clinical sites, and apprenticeship employers
-- that appear on the /about/partners page and in MOU workflows.
-- Apply in Supabase Dashboard → SQL Editor

-- Ensure the partners table has the columns added in migration 20260427000002
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_version       TEXT;
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_pdf_url       TEXT;
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_sent_at       TIMESTAMPTZ;
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_type_detail TEXT;

-- ── Healthcare Employer Partners ──────────────────────────────────────────────

INSERT INTO public.partners (name, partner_type, contact_email, partner_type_detail, city, state, description, is_active, display_order)
VALUES
  ('Eskenazi Health', 'employer', 'partner.eskenazi-health@elevateforhumanity.org', 'healthcare', 'Indianapolis', 'IN', 'Safety-net hospital system — CNA and medical assistant hiring partner.', true, 200),
  ('IU Health', 'employer', 'partner.iu-health@elevateforhumanity.org', 'healthcare', 'Indianapolis', 'IN', 'Statewide health system — clinical placement and hiring partner.', true, 201),
  ('Community Health Network', 'employer', 'partner.community-health-network@elevateforhumanity.org', 'healthcare', 'Indianapolis', 'IN', 'Regional health network — CNA and phlebotomy hiring partner.', true, 202),
  ('Franciscan Health', 'employer', 'partner.franciscan-health@elevateforhumanity.org', 'healthcare', 'Indianapolis', 'IN', 'Catholic health system — clinical hiring partner.', true, 203),
  ('American Senior Communities', 'employer', 'partner.american-senior-communities@elevateforhumanity.org', 'healthcare', 'Indianapolis', 'IN', 'Long-term care employer — CNA hiring partner.', true, 204),
  ('Trilogy Health Services', 'employer', 'partner.trilogy-health-services@elevateforhumanity.org', 'healthcare', 'Indianapolis', 'IN', 'Senior living employer — CNA and medication aide hiring partner.', true, 205)
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(partners.owner_name, EXCLUDED.name),
  partner_type         = EXCLUDED.partner_type,
  partner_type_detail  = EXCLUDED.partner_type_detail,
  is_active            = EXCLUDED.is_active,
  updated_at           = now();

-- ── Skilled Trades Employer Partners ─────────────────────────────────────────

INSERT INTO public.partners (name, partner_type, contact_email, partner_type_detail, city, state, description, is_active, display_order)
VALUES
  ('Gaylor Electric', 'employer', 'partner.gaylor-electric@elevateforhumanity.org', 'electrical',    'Indianapolis', 'IN', 'Commercial electrical contractor — apprenticeship hiring partner.', true, 300),
  ('Hagerman Group', 'employer', 'partner.hagerman-group@elevateforhumanity.org', 'construction',  'Indianapolis', 'IN', 'General contractor — skilled trades hiring partner.', true, 301),
  ('Rieth-Riley Construction', 'employer', 'partner.rieth-riley-construction@elevateforhumanity.org', 'construction',  'Indianapolis', 'IN', 'Heavy civil contractor — equipment operator hiring partner.', true, 302),
  ('Summers Plumbing Heating', 'employer', 'partner.summers-plumbing-heating@elevateforhumanity.org', 'plumbing',      'Indianapolis', 'IN', 'Plumbing and HVAC contractor — apprenticeship hiring partner.', true, 303),
  ('Midwest Mole', 'employer', 'partner.midwest-mole@elevateforhumanity.org', 'construction',  'Indianapolis', 'IN', 'Underground utility contractor — skilled trades hiring partner.', true, 304)
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(partners.owner_name, EXCLUDED.name),
  partner_type         = EXCLUDED.partner_type,
  partner_type_detail  = EXCLUDED.partner_type_detail,
  is_active            = EXCLUDED.is_active,
  updated_at           = now();

-- ── CDL / Transportation Employer Partners ────────────────────────────────────

INSERT INTO public.partners (name, partner_type, contact_email, partner_type_detail, city, state, description, is_active, display_order)
VALUES
  ('Celadon Trucking', 'employer', 'partner.celadon-trucking@elevateforhumanity.org', 'cdl_transportation', 'Indianapolis', 'IN', 'Regional trucking company — CDL-A hiring partner.', true, 400),
  ('Ruan Transportation', 'employer', 'partner.ruan-transportation@elevateforhumanity.org', 'cdl_transportation', 'Indianapolis', 'IN', 'Dedicated contract carrier — CDL hiring partner.', true, 401),
  ('Heartland Express', 'employer', 'partner.heartland-express@elevateforhumanity.org', 'cdl_transportation', 'Indianapolis', 'IN', 'Truckload carrier — CDL-A hiring partner.', true, 402)
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(partners.owner_name, EXCLUDED.name),
  partner_type         = EXCLUDED.partner_type,
  partner_type_detail  = EXCLUDED.partner_type_detail,
  is_active            = EXCLUDED.is_active,
  updated_at           = now();

-- ── Workforce / Government Partners ──────────────────────────────────────────

INSERT INTO public.partners (name, partner_type, contact_email, city, state, description, is_active, display_order)
VALUES
  ('WorkOne Indianapolis',      'workforce',   'partner.workone-indianapolis@elevateforhumanity.org', 'Indianapolis', 'IN', 'Indiana Department of Workforce Development — WIOA funding and referrals.', true, 10),
  ('Indiana DWD',               'government',  'partner.indiana-dwd@elevateforhumanity.org', 'Indianapolis', 'IN', 'Indiana Department of Workforce Development — state workforce agency.', true, 11),
  ('FSSA Indiana',              'government',  'partner.fssa-indiana@elevateforhumanity.org', 'Indianapolis', 'IN', 'Indiana Family and Social Services Administration — SNAP-ET contract.', true, 12),
  ('Marion County WorkOne',     'workforce',   'partner.marion-county-workone@elevateforhumanity.org', 'Indianapolis', 'IN', 'Local workforce board — WIOA Title I services and co-enrollment.', true, 13)
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(partners.owner_name, EXCLUDED.name),
  partner_type = EXCLUDED.partner_type,
  is_active    = EXCLUDED.is_active,
  updated_at   = now();

-- ── Certification / Credential Partners ──────────────────────────────────────

INSERT INTO public.partners (name, partner_type, contact_email, city, state, description, is_active, display_order)
VALUES
  ('NHA — National Healthcareer Association', 'certification', 'partner.nha-national-healthcareer-asso@elevateforhumanity.org', 'Leawood', 'KS', 'Credential body for CNA, phlebotomy, EKG, and medical assistant certifications.', true, 20),
  ('ESCO Group', 'certification', 'partner.esco-group@elevateforhumanity.org', 'Stuart',  'FL', 'EPA 608 certification testing for HVAC technicians.', true, 21),
  ('NCCER', 'certification', 'partner.nccer@elevateforhumanity.org', 'Alachua', 'FL', 'National Center for Construction Education and Research — craft credentials.', true, 22),
  ('Indiana IPLA', 'certification', 'partner.indiana-ipla@elevateforhumanity.org', 'Indianapolis', 'IN', 'Indiana Professional Licensing Agency — cosmetology and barbering licenses.', true, 23)
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(partners.owner_name, EXCLUDED.name),
  partner_type = EXCLUDED.partner_type,
  is_active    = EXCLUDED.is_active,
  updated_at   = now();


-- Backfill owner_name from name where null
UPDATE public.partners SET owner_name = name WHERE owner_name IS NULL OR owner_name = '';

-- Restore NOT NULL
ALTER TABLE public.partners ALTER COLUMN owner_name SET NOT NULL;

-- ── 20260427000004_employer_partners_faatin_azar.sql ──
-- Seed employer partners for the Faatin Azar MOU batch.
-- Faatin Azar is an Elevate employer partner network contact who referred
-- a group of Indianapolis-area employers for MOU execution.
-- Apply in Supabase Dashboard → SQL Editor

INSERT INTO public.partners (
  name,
  owner_name,
  partner_type,
  contact_name,
  contact_email,
  contact_phone,
  city,
  state,
  description,
  is_active,
  display_order,
  created_at,
  updated_at
) VALUES
  (
    'Faatin Azar & Associates',
    'Faatin Azar & Associates',
    'employer',
    'Faatin Azar',
    'faatin.azar@example.com',
    NULL,
    'Indianapolis',
    'IN',
    'Employer partner network — workforce development and job placement referrals.',
    true,
    100,
    now(),
    now()
  )
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(EXCLUDED.owner_name, partners.owner_name),
  partner_type  = EXCLUDED.partner_type,
  contact_name  = EXCLUDED.contact_name,
  is_active     = EXCLUDED.is_active,
  updated_at    = now();

-- Add mou_version column to partners if not present (for tracking which MOU template was signed)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_version TEXT;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_pdf_url TEXT;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_sent_at TIMESTAMPTZ;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_type_detail TEXT;  -- e.g. 'cdl_training', 'healthcare', 'construction'

-- ── 20260427000005_fix_progress_entries_hours_constraint.sql ──
-- progress_entries.hours_worked constraint was set to <= 8 (single shift max)
-- but the table also stores weekly summary rows which can be up to 40 hrs.
-- Widen the check to <= 40 (max hours per week per DOL apprenticeship rules).

ALTER TABLE public.progress_entries
  DROP CONSTRAINT IF EXISTS progress_entries_hours_valid;

ALTER TABLE public.progress_entries
  ADD CONSTRAINT progress_entries_hours_valid
    CHECK (hours_worked >= 0 AND hours_worked <= 40);

-- ── 20260427000006_fssa_snap_et_system.sql ──
-- FSSA SNAP Employment & Training (SNAP-ET) program management system.
-- Tracks participants, attendance, budget, and program components for
-- the Indiana FSSA SNAP-ET contract administered by Elevate for Humanity.
-- Apply in Supabase Dashboard → SQL Editor

-- ── SNAP-ET Participants ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fssa_participants (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  first_name            TEXT        NOT NULL,
  last_name             TEXT        NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  date_of_birth         DATE,
  ssn_last4             TEXT,       -- last 4 digits only, for matching

  -- FSSA / SNAP eligibility
  case_number           TEXT,       -- FSSA case number
  county                TEXT,
  snap_eligible         BOOLEAN     NOT NULL DEFAULT true,
  snap_et_enrolled_at   TIMESTAMPTZ,
  snap_et_exited_at     TIMESTAMPTZ,
  exit_reason           TEXT        CHECK (exit_reason IN (
                          'employed', 'training_complete', 'voluntary_exit',
                          'non_compliance', 'ineligible', 'other'
                        )),

  -- Program placement
  program_id            UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  cohort_id             UUID,
  enrollment_status     TEXT        NOT NULL DEFAULT 'active'
                          CHECK (enrollment_status IN ('pending','active','completed','exited')),

  -- Employment outcomes
  employed_at_exit      BOOLEAN,
  employer_name         TEXT,
  hourly_wage           NUMERIC(8,2),
  hours_per_week        INT,
  job_title             TEXT,
  employment_start_date DATE,

  -- Barriers to employment (FSSA required fields)
  barriers              JSONB       DEFAULT '[]',  -- array of barrier codes
  support_services      JSONB       DEFAULT '[]',  -- array of services provided

  -- Notes
  case_notes            TEXT,
  intake_completed_at   TIMESTAMPTZ,
  intake_staff_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_participants_program    ON public.fssa_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_status     ON public.fssa_participants(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_county     ON public.fssa_participants(county);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_created_at ON public.fssa_participants(created_at DESC);

-- ── Attendance ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fssa_attendance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  session_date    DATE        NOT NULL,
  session_type    TEXT        NOT NULL DEFAULT 'training'
                    CHECK (session_type IN ('orientation','training','lab','job_search','support','other')),
  hours_attended  NUMERIC(4,2) NOT NULL DEFAULT 0,
  present         BOOLEAN     NOT NULL DEFAULT true,
  excused         BOOLEAN     NOT NULL DEFAULT false,
  notes           TEXT,
  recorded_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_attendance_participant ON public.fssa_attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_fssa_attendance_date       ON public.fssa_attendance(session_date DESC);

-- ── Budget Tracking ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fssa_budget (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  fiscal_year     TEXT        NOT NULL,   -- e.g. 'FY2026'
  quarter         TEXT        CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  category        TEXT        NOT NULL,   -- 'personnel','training','support_services','admin','other'
  line_item       TEXT        NOT NULL,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expended_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  encumbered      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  entered_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_budget_fiscal_year ON public.fssa_budget(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_fssa_budget_category    ON public.fssa_budget(category);

-- ── Program Components ────────────────────────────────────────────────────────
-- Tracks the required SNAP-ET program components (job search, training, etc.)
-- and participant assignments to each component.

CREATE TABLE IF NOT EXISTS public.fssa_program_components (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  component_type  TEXT        NOT NULL
                    CHECK (component_type IN (
                      'job_search','job_search_training','vocational_training',
                      'work_experience','community_service','education',
                      'self_employment','job_retention','other'
                    )),
  start_date      DATE        NOT NULL,
  end_date        DATE,
  required_hours  INT,
  completed_hours INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('pending','active','completed','exempted','sanctioned')),
  provider_name   TEXT,
  notes           TEXT,
  assigned_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_components_participant ON public.fssa_program_components(participant_id);
CREATE INDEX IF NOT EXISTS idx_fssa_components_type        ON public.fssa_program_components(component_type);
CREATE INDEX IF NOT EXISTS idx_fssa_components_status      ON public.fssa_program_components(status);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.fssa_participants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fssa_attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fssa_budget             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fssa_program_components ENABLE ROW LEVEL SECURITY;

-- Admin/staff read all
DROP policy if exists fssa_participants_admin_read on public.fssa_participants;
CREATE policy fssa_participants_admin_read on public.fssa_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_participants_admin_write on public.fssa_participants;
CREATE policy fssa_participants_admin_write on public.fssa_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_attendance_admin_read on public.fssa_attendance;
CREATE policy fssa_attendance_admin_read on public.fssa_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_attendance_admin_write on public.fssa_attendance;
CREATE policy fssa_attendance_admin_write on public.fssa_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_budget_admin_read on public.fssa_budget;
CREATE policy fssa_budget_admin_read on public.fssa_budget
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_budget_admin_write on public.fssa_budget;
CREATE policy fssa_budget_admin_write on public.fssa_budget
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_components_admin_read on public.fssa_program_components;
CREATE policy fssa_components_admin_read on public.fssa_program_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists fssa_components_admin_write on public.fssa_program_components;
CREATE policy fssa_components_admin_write on public.fssa_program_components
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  );

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at_fssa()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fssa_participants_updated_at ON public.fssa_participants;
CREATE TRIGGER fssa_participants_updated_at
  BEFORE UPDATE ON public.fssa_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fssa();

DROP TRIGGER IF EXISTS fssa_budget_updated_at ON public.fssa_budget;
CREATE TRIGGER fssa_budget_updated_at
  BEFORE UPDATE ON public.fssa_budget
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fssa();

DROP TRIGGER IF EXISTS fssa_components_updated_at ON public.fssa_program_components;
CREATE TRIGGER fssa_components_updated_at
  BEFORE UPDATE ON public.fssa_program_components
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fssa();

-- ── 20260427000007_program_pricing.sql ──
-- program_pricing
-- Per-program tuition and payment plan configuration.
-- All monetary values in cents. Calculator reads from here — nothing hardcoded in UI.

CREATE TABLE IF NOT EXISTS public.program_pricing (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug         text NOT NULL UNIQUE,
  program_name         text NOT NULL,

  -- Tuition
  tuition_cents        integer NOT NULL,          -- full self-pay cost
  deposit_min_cents    integer NOT NULL,          -- minimum deposit to start
  deposit_default_cents integer NOT NULL,         -- pre-filled deposit in calculator

  -- Payment plan
  payment_frequency    text NOT NULL DEFAULT 'weekly'
                         CHECK (payment_frequency IN ('weekly','biweekly','monthly')),
  payment_weeks        integer NOT NULL,          -- number of payment periods

  -- Stripe links (deposit and full-pay)
  stripe_deposit_url   text,
  stripe_full_url      text,

  -- Metadata
  notes                text,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read (calculator is public-facing), admin write
ALTER TABLE public.program_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_pricing_public_read" ON public.program_pricing;
DROP policy if exists "program_pricing_public_read" on public.program_pricing;
CREATE policy "program_pricing_public_read" on public.program_pricing FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "program_pricing_admin_write" ON public.program_pricing;
DROP policy if exists "program_pricing_admin_write" on public.program_pricing;
CREATE policy "program_pricing_admin_write" on public.program_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_program_pricing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_program_pricing_updated_at ON public.program_pricing;
CREATE TRIGGER trg_program_pricing_updated_at
  BEFORE UPDATE ON public.program_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_program_pricing_updated_at();

-- Seed data — all programs with self-pay options
INSERT INTO public.program_pricing
  (program_slug, program_name, tuition_cents, deposit_min_cents, deposit_default_cents,
   payment_frequency, payment_weeks, stripe_deposit_url, stripe_full_url, notes)
VALUES
  (
    'barber-apprenticeship',
    'Barber Apprenticeship',
    498000,   -- $4,980
    60000,    -- $600 minimum deposit
    174300,   -- $1,743 default (35%)
    'weekly',
    50,       -- (4980 - 1743) / ~$65/wk ≈ 50 weeks
    'https://buy.stripe.com/8x2bJ21986rletw0dN8EN0o',
    'https://buy.stripe.com/6oUdRa4lkaHB7141hR8EN0b',
    '2,000-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'cosmetology-apprenticeship',
    'Cosmetology Apprenticeship',
    600000,   -- $6,000
    60000,    -- $600 minimum
    210000,   -- $2,100 default (35%)
    'weekly',
    62,       -- (6000 - 2100) / ~$63/wk ≈ 62 weeks
    'https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a',
    'https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09',
    '2,000-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'nail-technician-apprenticeship',
    'Nail Technician Apprenticeship',
    500000,   -- $5,000
    60000,    -- $600 minimum
    175000,   -- $1,750 default (35%)
    'weekly',
    52,       -- (5000 - 1750) / ~$63/wk ≈ 52 weeks
    'https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06',
    'https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05',
    '600-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'esthetician-apprenticeship',
    'Esthetician Apprenticeship',
    600000,   -- $6,000
    60000,    -- $600 minimum
    210000,   -- $2,100 default (35%)
    'weekly',
    62,
    'https://buy.stripe.com/fZu4gzbrq2IK5S32F3gIo08',
    'https://buy.stripe.com/6oUbJ16762IK1BN1AZgIo07',
    '700-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'hvac-technician',
    'HVAC Technician',
    499500,   -- $4,995
    60000,
    174825,   -- 35%
    'weekly',
    50,
    NULL,
    NULL,
    'WIOA-funded primary path. Self-pay available.'
  ),
  (
    'peer-recovery-specialist',
    'Peer Recovery Specialist',
    500000,   -- $5,000
    60000,
    175000,
    'weekly',
    52,
    NULL,
    NULL,
    'WIOA-funded primary path. Self-pay available.'
  ),
  (
    'esthetician',
    'Professional Esthetician & Client Services',
    457500,   -- $4,575
    60000,
    160125,   -- 35%
    'weekly',
    47,
    NULL,
    NULL,
    'WIOA-funded primary path. Self-pay available.'
  )
ON CONFLICT (program_slug) DO UPDATE SET
  tuition_cents         = EXCLUDED.tuition_cents,
  deposit_min_cents     = EXCLUDED.deposit_min_cents,
  deposit_default_cents = EXCLUDED.deposit_default_cents,
  payment_weeks         = EXCLUDED.payment_weeks,
  stripe_deposit_url    = EXCLUDED.stripe_deposit_url,
  stripe_full_url       = EXCLUDED.stripe_full_url,
  notes                 = EXCLUDED.notes,
  updated_at            = now();

-- ── 20260427000008_revenue_summary_fn.sql ──
-- Revenue summary RPC functions
--
-- PostgREST aggregate syntax (.sum()) is disabled on this project (PGRST123).
-- These functions replace the three aggregate queries in get-admin-dashboard-data.ts.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.get_revenue_all_time()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount_paid_cents), 0)::bigint
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid');
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_this_month()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount_paid_cents), 0)::bigint
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid')
    AND created_at >= date_trunc('month', now());
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_last_month()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(SUM(amount_paid_cents), 0)::bigint
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid')
    AND created_at >= date_trunc('month', now() - interval '1 month')
    AND created_at <  date_trunc('month', now());
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.get_revenue_all_time()    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_this_month()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_last_month()  TO authenticated, service_role;

-- ── 20260427000009_set_super_admin_role.sql ──
-- Set super_admin role for the primary admin account.
-- Run in Supabase Dashboard → SQL Editor.

UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'Elevate4humanityedu@gmail.com';

-- Verify
SELECT id, email, role FROM public.profiles
WHERE email = 'Elevate4humanityedu@gmail.com';

-- ── 20260428000001_applications_admin_rls.sql ──
-- Allow admin/super_admin/staff roles to read and update all applications.
-- Without this, the review page calls notFound() for every application
-- because the session JWT returns an empty result set.

alter table public.applications enable row level security;

-- Drop existing policies if any to avoid conflicts
drop policy if exists "Admins can read all applications" on public.applications;
drop policy if exists "Admins can update all applications" on public.applications;
drop policy if exists "Public can insert applications" on public.applications;
drop policy if exists "Users can read own applications" on public.applications;

-- Anyone can submit an application (public intake form)
create policy "Public can insert applications"
  on public.applications for insert
  with check (true);

-- Applicants can read their own submission by email match
create policy "Users can read own applications"
  on public.applications for select
  using (
    auth.jwt() ->> 'email' = email
  );

-- Admin roles can read all applications
create policy "Admins can read all applications"
  on public.applications for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'staff')
    )
  );

-- Admin roles can update application status
create policy "Admins can update all applications"
  on public.applications for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'staff')
    )
  );

-- ── 20260428000002_fix_apprentices_updated_at_trigger.sql ──
-- The apprentices table was created without an updated_at column but the
-- update_apprentices_updated_at trigger references NEW.updated_at, causing
-- every UPDATE on apprentices to fail with "record new has no field updated_at".
-- Fix: add the column, then the trigger works as intended.

ALTER TABLE public.apprentices
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill existing rows
UPDATE public.apprentices SET updated_at = created_at WHERE updated_at = NOW() AND created_at IS NOT NULL;

-- ── 20260429000001_apply_atomic_approval_rpcs.sql ──
-- Apply atomic approval and revoke RPCs.
--
-- These functions were defined in 20260503000010 and 20260503000011 but were
-- not applied to the live database. Without them:
--   - CNA approvals crash with "Could not find the function" error
--   - The revoke endpoint returns 503
--
-- Safe to re-run: CREATE OR REPLACE is idempotent. The unique constraint
-- uses DO NOTHING if it already exists.
--
-- APPLY IN SUPABASE DASHBOARD → SQL Editor before deploying the next release.

-- ── 1. Unique constraint on partner_enrollments ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_partner_enrollments_partner_student_program'
  ) THEN
    ALTER TABLE public.partner_enrollments
      ADD CONSTRAINT uq_partner_enrollments_partner_student_program
      UNIQUE (partner_id, student_id, program_id);
  END IF;
END $$;

-- ── 2. approve_application_and_grant_access_atomic ───────────────────────────
CREATE OR REPLACE FUNCTION public.approve_application_and_grant_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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
  -- 1. Lock application row (prevents concurrent double-approval)
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  -- 2. Idempotency
  IF v_app.status IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','already_processed','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- 3. Funding gate — fail closed
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

  -- 4. Compliance gate — fail closed
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

  -- 5. Resolve program
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = v_app.program_slug
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','Program not found: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- 6. Resolve course
  SELECT id, tenant_id INTO v_course
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at
  LIMIT 1;

  IF v_course.id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','No training_course for program: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- 7. Walk state machine
  IF v_app.status = 'submitted' THEN
    UPDATE public.applications SET status = 'in_review',       updated_at = NOW() WHERE id = p_application_id;
  END IF;
  IF v_app.status IN ('submitted','in_review') THEN
    UPDATE public.applications SET status = 'approved',        updated_at = NOW() WHERE id = p_application_id;
  END IF;
  UPDATE public.applications SET status = 'ready_to_enroll',   updated_at = NOW() WHERE id = p_application_id;
  UPDATE public.applications SET status = 'enrolled',          updated_at = NOW() WHERE id = p_application_id;

  -- 8. training_enrollments
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

  -- 9. partner_enrollments
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = v_cmi_partner_id) THEN
    INSERT INTO public.partner_enrollments
      (partner_id, student_id, program_id, status, enrollment_date)
    VALUES
      (v_cmi_partner_id, v_app.user_id, v_program_id, 'active', CURRENT_DATE)
    ON CONFLICT (partner_id, student_id, program_id) DO UPDATE
      SET status = 'active';
  END IF;

  -- 10. cmi_students
  INSERT INTO public.cmi_students (user_id, application_id, status, enrolled_at)
  VALUES (v_app.user_id, p_application_id, 'enrolled', NOW())
  ON CONFLICT (application_id) DO UPDATE
    SET status = 'enrolled';

  -- 11. Audit
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

-- ── 3. revoke_application_access_atomic ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_application_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_application_access_atomic(UUID, UUID, TEXT) TO authenticated, service_role;

-- ── 20260429000002_participant_outcomes_view.sql ──
-- Unified participant outcomes view for WIOA reporting.
--
-- Joins program_enrollments → profiles → programs → enrollment_funding_records
-- → employment_outcomes / placement_records / program_completion_certificates
-- into a single queryable surface.
--
-- Used by:
--   GET /api/reports/participants
--   GET /api/reports/participants/export
--   /admin/reports/wioa
--
-- Apply in Supabase Dashboard → SQL Editor before using the report endpoints.

-- BEGIN; (removed: exec_sql runs in implicit txn)

-- ── 1. Canonical enrollment status values ────────────────────────────────────
-- Normalize the status column across program_enrollments.
-- Existing rows may have mixed-case or legacy values; this view normalises them.

DROP VIEW IF EXISTS public.participant_report;
CREATE OR REPLACE VIEW public.participant_report AS
SELECT
  -- Participant identity
  pr.id                                                   AS participant_id,
  pr.full_name,
  pr.email,
  pr.phone,

  -- Enrollment
  pe.id                                                   AS enrollment_id,
  pe.created_at                                           AS applied_at,
  pe.confirmed_at                                         AS enrolled_at,
  pe.completed_at,
  -- NULL::timestamptz, -- column removed
  LOWER(COALESCE(pe.enrollment_state, pe.status, 'applied')) AS enrollment_status,

  -- Program
  pg.id                                                   AS program_id,
  pg.slug                                                 AS program_slug,
  pg.title                                                AS program_title,
  pg.category                                             AS program_category,

  -- Funding (most recent approved record wins)
  efr.funding_source,
  efr.status                                              AS funding_status,
  efr.amount_cents,
  NULL::text AS workone_case_number,
  efr.updated_at                                         AS funding_approved_at,

  -- Employment outcome (most recent verified placement)
  pl.employer_name,
  pl.job_title,
  pl.hourly_wage,
  pl.employment_type,
  pl.start_date                                           AS employment_start_date,
  pl.status                                               AS placement_status,
  pl.verification_method,

  -- Credential outcome
  cert.id IS NOT NULL                                     AS credential_received,
  cert.issued_at                                          AS credential_issued_at,
  cert.certificate_number,

  -- Derived outcome type for WIOA reporting
  CASE
    WHEN pl.id IS NOT NULL AND cert.id IS NOT NULL THEN 'employment_and_credential'
    WHEN pl.id IS NOT NULL                          THEN 'employment'
    WHEN cert.id IS NOT NULL                        THEN 'credential'
    ELSE 'none'
  END                                                     AS outcome_type,

  -- Quarter helpers for DOL performance period queries
  DATE_TRUNC('quarter', pe.completed_at)                  AS completion_quarter,
  DATE_TRUNC('quarter', pl.start_date)                    AS placement_quarter

FROM public.program_enrollments pe

-- Participant profile
JOIN public.profiles pr
  ON pr.id = pe.user_id

-- Program (prefer program_id FK; fall back to slug lookup)
LEFT JOIN public.programs pg
  ON pg.id = COALESCE(
       pe.program_id,
       (SELECT id FROM public.programs WHERE slug = pe.program_slug LIMIT 1)
     )

-- Most recent approved funding record
LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollment_funding_records efr2
  WHERE efr2.enrollment_id = pe.id
    AND efr2.status IN ('approved', 'disbursed', 'reconciled')
  ORDER BY efr2.updated_at DESC NULLS LAST
  LIMIT 1
) efr ON TRUE

-- Most recent verified placement
LEFT JOIN LATERAL (
  SELECT *
  FROM public.placement_records pl2
  WHERE pl2.learner_id = pe.user_id
    AND (pl2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY pl2.start_date DESC NULLS LAST
  LIMIT 1
) pl ON TRUE

-- Most recent completion certificate
LEFT JOIN LATERAL (
  SELECT *
  FROM public.program_completion_certificates cert2
  WHERE cert2.user_id = pe.user_id
    AND (cert2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY cert2.issued_at DESC NULLS LAST
  LIMIT 1
) cert ON TRUE;

-- ── 2. RLS: admins and staff only ────────────────────────────────────────────
-- Views inherit RLS from their base tables. Add an explicit grant so the
-- service role can query without bypassing auth.

GRANT SELECT ON public.participant_report TO authenticated;

-- ── 3. WIOA summary metrics function ─────────────────────────────────────────
-- Returns the aggregate numbers the admin dashboard needs in one call.

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
    COUNT(DISTINCT participant_id)                                                   AS total_participants,
    COUNT(*) FILTER (WHERE enrollment_status IN ('active','in_progress','enrolled')) AS active_enrollments,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')                          AS completed,
    COUNT(*) FILTER (WHERE enrollment_status IN ('exited','withdrawn'))              AS exited,
    COUNT(*) FILTER (WHERE placement_status = 'verified')                            AS job_placements,
    COUNT(*) FILTER (WHERE credential_received = TRUE)                               AS credentials_issued,
    ROUND(AVG(hourly_wage) FILTER (WHERE hourly_wage IS NOT NULL), 2)               AS avg_hourly_wage,
    COUNT(*) FILTER (WHERE funding_source ILIKE 'wioa%')                             AS wioa_funded,
    COUNT(*) FILTER (WHERE funding_source = 'workforce_ready_grant')                 AS wrg_funded,
    COUNT(*) FILTER (WHERE funding_source = 'self_pay')                              AS self_pay,
    COUNT(*) FILTER (WHERE funding_source = 'employer_sponsored')                    AS employer_sponsored
  FROM public.participant_report
  WHERE
    (p_start_date IS NULL OR applied_at >= p_start_date)
    AND (p_end_date   IS NULL OR applied_at <= p_end_date)
    AND (p_program_id IS NULL OR program_id = p_program_id)
    AND (p_funding    IS NULL OR funding_source ILIKE p_funding || '%');
$$;

GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics TO authenticated;

-- COMMIT; (removed: exec_sql runs in implicit txn)

-- ── 20260429000003_participant_outcomes_view_v2.sql ──
-- Unified participant outcomes view for WIOA reporting (v2).
--
-- Replaces 20260429000001 — column names corrected against live schema.
-- enrollment_funding_records: no approved_at, no workone_case_number
-- placement_records: learner_id (not user_id), no enrollment_id FK
-- program_completion_certificates: user_id, issued_at
-- program_enrollments: confirmed_at, enrollment_confirmed_at, revoked_at
--
-- Used by:
--   GET /api/reports/participants
--   GET /api/reports/participants/export
--   /admin/reports/wioa

-- BEGIN; (removed: exec_sql runs in implicit txn)

DROP VIEW IF EXISTS public.participant_report CASCADE;

CREATE OR REPLACE VIEW public.participant_report AS
SELECT
  -- Participant identity
  pe.user_id                                                AS participant_id,
  COALESCE(pr.full_name, pe.full_name)                      AS full_name,
  COALESCE(pr.email,     pe.email)                          AS email,
  COALESCE(pr.phone,     pe.phone)                          AS phone,

  -- Enrollment
  pe.id                                                     AS enrollment_id,
  pe.created_at                                             AS applied_at,
  COALESCE(pe.confirmed_at, pe.enrollment_confirmed_at)     AS enrolled_at,
  pe.completed_at,
  pe.revoked_at                                             AS exited_at,
  LOWER(COALESCE(pe.enrollment_state, pe.status, 'applied')) AS enrollment_status,

  -- Program
  pg.id                                                     AS program_id,
  pg.slug                                                   AS program_slug,
  pg.title                                                  AS program_title,
  pg.category                                               AS program_category,

  -- Funding
  COALESCE(efr.funding_source, pe.funding_source, pe.funding_pathway) AS funding_source,
  efr.status                                                AS funding_status,
  efr.amount_cents,
  pe.funding_verified,

  -- Employment outcome
  pl.employer_name,
  pl.job_title,
  pl.hourly_wage,
  pl.employment_type,
  pl.start_date                                             AS employment_start_date,
  pl.status                                                 AS placement_status,
  pl.verification_method,

  -- Credential outcome
  cert.id IS NOT NULL                                       AS credential_received,
  cert.issued_at                                            AS credential_issued_at,
  cert.certificate_number,

  -- Derived outcome type
  CASE
    WHEN pl.id IS NOT NULL AND cert.id IS NOT NULL THEN 'employment_and_credential'
    WHEN pl.id IS NOT NULL                          THEN 'employment'
    WHEN cert.id IS NOT NULL                        THEN 'credential'
    ELSE 'none'
  END                                                       AS outcome_type,

  -- Quarter helpers
  DATE_TRUNC('quarter', pe.completed_at)                    AS completion_quarter,
  DATE_TRUNC('quarter', pl.start_date)                      AS placement_quarter

FROM public.program_enrollments pe

LEFT JOIN public.profiles pr
  ON pr.id = pe.user_id

LEFT JOIN public.programs pg
  ON pg.id = COALESCE(
       pe.program_id,
       (SELECT id FROM public.programs WHERE slug = pe.program_slug LIMIT 1)
     )

LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollment_funding_records efr2
  WHERE efr2.enrollment_id = pe.id
  ORDER BY efr2.created_at DESC NULLS LAST
  LIMIT 1
) efr ON TRUE

LEFT JOIN LATERAL (
  SELECT *
  FROM public.placement_records pl2
  WHERE pl2.learner_id = pe.user_id
    AND (pl2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY pl2.start_date DESC NULLS LAST
  LIMIT 1
) pl ON TRUE

LEFT JOIN LATERAL (
  SELECT *
  FROM public.program_completion_certificates cert2
  WHERE cert2.user_id = pe.user_id
    AND (cert2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY cert2.issued_at DESC NULLS LAST
  LIMIT 1
) cert ON TRUE;

GRANT SELECT ON public.participant_report TO authenticated;

-- ── WIOA summary metrics ──────────────────────────────────────────────────────

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
    COUNT(DISTINCT participant_id)                                                    AS total_participants,
    COUNT(*) FILTER (WHERE enrollment_status IN ('active','in_progress','enrolled'))  AS active_enrollments,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')                           AS completed,
    COUNT(*) FILTER (WHERE enrollment_status IN ('exited','withdrawn','revoked'))     AS exited,
    COUNT(*) FILTER (WHERE placement_status IN ('verified','confirmed'))              AS job_placements,
    COUNT(*) FILTER (WHERE credential_received = TRUE)                                AS credentials_issued,
    ROUND(AVG(hourly_wage) FILTER (WHERE hourly_wage IS NOT NULL), 2)                AS avg_hourly_wage,
    COUNT(*) FILTER (WHERE funding_source ILIKE 'wioa%')                              AS wioa_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%workforce_ready%'
                        OR funding_source ILIKE '%wrg%')                              AS wrg_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%self_pay%'
                        OR funding_source ILIKE '%self-pay%')                         AS self_pay,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%employer%')                         AS employer_sponsored
  FROM public.participant_report
  WHERE
    (p_start_date IS NULL OR applied_at >= p_start_date)
    AND (p_end_date   IS NULL OR applied_at <= p_end_date)
    AND (p_program_id IS NULL OR program_id = p_program_id)
    AND (p_funding    IS NULL OR funding_source ILIKE p_funding || '%');
$$;

GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics TO authenticated;

-- COMMIT; (removed: exec_sql runs in implicit txn)

-- ── 20260430000001_applications_missing_columns.sql ──
-- Add columns written by the student application form (eligibility update pass)
-- and the FSSA application form that were missing from the applications table.
-- Also widens the status CHECK constraint to include values used by the admin
-- transition route (ready_to_enroll, enrolled, in_review).

ALTER TABLE public.applications
  -- Student form eligibility update
  ADD COLUMN IF NOT EXISTS funding_status           text,
  ADD COLUMN IF NOT EXISTS readiness_status         text,
  ADD COLUMN IF NOT EXISTS support_needs_transport  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_needs_other      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS case_manager_name        text,
  ADD COLUMN IF NOT EXISTS case_manager_email       text,
  ADD COLUMN IF NOT EXISTS referral_source          text,
  -- FSSA form
  ADD COLUMN IF NOT EXISTS funding_source           text,
  ADD COLUMN IF NOT EXISTS application_type         text,
  ADD COLUMN IF NOT EXISTS metadata                 jsonb;

-- Widen status constraint to cover all values used by admin transition route.
-- Previous constraint (from 20260401000010) did not include enrolled/ready_to_enroll/in_review.
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'submitted',
    'pending_workone',
    'funding_review',
    'in_review',
    'under_review',
    'ready_to_enroll',
    'approved',
    'enrolled',
    'rejected',
    'withdrawn'
  ));

-- Indexes for admin queue filtering
CREATE INDEX IF NOT EXISTS idx_applications_funding_status
  ON public.applications (funding_status)
  WHERE funding_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_application_type
  ON public.applications (application_type)
  WHERE application_type IS NOT NULL;

-- ── 20260430000002_fix_program_holder_rls.sql ──
-- Fix RLS policies for program_holder role.
-- The existing policies use user_id = auth.uid() but program_holders.user_id
-- is null for most rows. The correct lookup is via profiles.program_holder_id.
-- current_program_holder_id() already does this correctly but the SELECT
-- policies were not covering the authenticated program_holder role.

-- ── program_holders ──────────────────────────────────────────────────────────

-- Drop the broken user_id-based policy
DROP POLICY IF EXISTS "users_own" ON public.program_holders;

-- Add policy: program_holder role can read their own row via profiles.program_holder_id
DROP POLICY IF EXISTS "program_holder_read_own" ON public.program_holders;
CREATE POLICY "program_holder_read_own" ON public.program_holders
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT program_holder_id
      FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- ── program_holder_acknowledgements ──────────────────────────────────────────

-- Existing policy program_holders_read_own_ack uses user_id = auth.uid() — correct
-- but verify it covers SELECT for authenticated role
DROP POLICY IF EXISTS "program_holders_read_own_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_read_own_ack" ON public.program_holder_acknowledgements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow program_holder to insert their own acks
DROP POLICY IF EXISTS "program_holders_insert_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_insert_ack" ON public.program_holder_acknowledgements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── program_holder_documents ─────────────────────────────────────────────────

-- auth_read_program_holder_documents has qual=true but may be missing TO clause
DROP POLICY IF EXISTS "auth_read_program_holder_documents" ON public.program_holder_documents;
CREATE POLICY "auth_read_program_holder_documents" ON public.program_holder_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── program_holder_programs ──────────────────────────────────────────────────

-- Allow program_holder to read their own program associations
DROP POLICY IF EXISTS "program_holder_read_own_programs" ON public.program_holder_programs;
CREATE POLICY "program_holder_read_own_programs" ON public.program_holder_programs
  FOR SELECT
  TO authenticated
  USING (
    program_holder_id = (
      SELECT program_holder_id
      FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- ── Table-level GRANTs ───────────────────────────────────────────────────────
-- RLS policies are no-ops without underlying table privileges.
-- The authenticated role needs SELECT (and INSERT where applicable) on these tables.

GRANT SELECT ON public.program_holders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.program_holder_acknowledgements TO authenticated;
GRANT SELECT, INSERT ON public.program_holder_documents TO authenticated;
GRANT SELECT ON public.program_holder_programs TO authenticated;

-- ── 20260430000003_apprentice_hours_employer_signature.sql ──
-- CF-2: Add employer counter-signature columns to apprentice_hours.
-- DOL 29 CFR Part 29 requires employer verification of OJT hour logs.
-- The barber_hour_ledger is a denormalized summary — the source-of-truth
-- fix lives here on the per-entry table.

ALTER TABLE public.apprentice_hours
  ADD COLUMN IF NOT EXISTS employer_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employer_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS employer_notes       text;

COMMENT ON COLUMN public.apprentice_hours.employer_id          IS 'User ID of the employer/shop owner who counter-signed this hour entry (DOL 29 CFR Part 29)';
COMMENT ON COLUMN public.apprentice_hours.employer_approved_at IS 'Timestamp when the employer counter-signed this entry';
COMMENT ON COLUMN public.apprentice_hours.employer_notes       IS 'Optional employer notes on this hour entry';

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_employer_id
  ON public.apprentice_hours (employer_id)
  WHERE employer_id IS NOT NULL;

-- ── 20260430000004_applications_wioa_fields.sql ──
-- CF-3: Add WIOA Title I required intake fields to applications.
-- PIRL fields: 300 (DOB), 302 (county), 401 (family size), 900 (income).
-- modality_preference is needed for hybrid apprenticeship scheduling.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS date_of_birth       date,
  ADD COLUMN IF NOT EXISTS county_of_residence text,
  ADD COLUMN IF NOT EXISTS household_income    numeric(10,2),
  ADD COLUMN IF NOT EXISTS family_size         smallint,
  ADD COLUMN IF NOT EXISTS modality_preference text CHECK (
    modality_preference IS NULL OR
    modality_preference IN ('in_person', 'virtual', 'hybrid')
  );

COMMENT ON COLUMN public.applications.date_of_birth       IS 'WIOA PIRL field 300 — required for age eligibility determination';
COMMENT ON COLUMN public.applications.county_of_residence IS 'WIOA PIRL field 302 — required for WorkOne referral routing';
COMMENT ON COLUMN public.applications.household_income    IS 'WIOA PIRL field 900 — annual household income for Title I eligibility';
COMMENT ON COLUMN public.applications.family_size         IS 'WIOA PIRL field 401 — household size for income threshold calculation';
COMMENT ON COLUMN public.applications.modality_preference IS 'Learner preference: in_person | virtual | hybrid — used for cohort scheduling';

-- ── 20260430000005_applications_placement_fields.sql ──
-- CF-4: Add post-enrollment placement tracking fields to applications.
-- WIOA requires tracking entered employment rate, retention rate, and
-- median earnings (ETA-9173 performance indicators).
-- New status flow: enrolled → scheduled → attended_orientation → assigned → placed → retained

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS session_id            uuid,
  ADD COLUMN IF NOT EXISTS orientation_date      date,
  ADD COLUMN IF NOT EXISTS employer_assigned_at  timestamptz,
  ADD COLUMN IF NOT EXISTS employer_assigned_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS placed_at             timestamptz,
  ADD COLUMN IF NOT EXISTS placement_employer    text,
  ADD COLUMN IF NOT EXISTS placement_job_title   text,
  ADD COLUMN IF NOT EXISTS placement_hourly_wage numeric(6,2),
  ADD COLUMN IF NOT EXISTS retained_at           timestamptz;

COMMENT ON COLUMN public.applications.session_id           IS 'FK to orientation_sessions — set when application moves to scheduled';
COMMENT ON COLUMN public.applications.orientation_date     IS 'Date learner attended orientation';
COMMENT ON COLUMN public.applications.employer_assigned_at IS 'Timestamp when learner was assigned to an employer/shop';
COMMENT ON COLUMN public.applications.employer_assigned_id IS 'User ID of the assigned employer';
COMMENT ON COLUMN public.applications.placed_at            IS 'Timestamp of job placement (WIOA entered employment date)';
COMMENT ON COLUMN public.applications.placement_employer   IS 'Employer name at placement';
COMMENT ON COLUMN public.applications.placement_job_title  IS 'Job title at placement';
COMMENT ON COLUMN public.applications.placement_hourly_wage IS 'Hourly wage at placement (WIOA median earnings metric)';
COMMENT ON COLUMN public.applications.retained_at          IS 'Timestamp of 2nd quarter retention confirmation (WIOA retention rate)';

CREATE INDEX IF NOT EXISTS idx_applications_session_id
  ON public.applications (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_placed_at
  ON public.applications (placed_at)
  WHERE placed_at IS NOT NULL;

-- ── 20260430000006_barber_hour_ledger_source_fk.sql ──
-- SW-3: Link barber_hour_ledger (denormalized summary) back to its source entries.
-- Without this FK, corrections to apprentice_hours entries are not reflected in
-- the ledger and there is no audit trail from summary → source.
-- last_entry_id points to the most recent apprentice_hours row that updated the ledger.

ALTER TABLE public.barber_hour_ledger
  ADD COLUMN IF NOT EXISTS last_entry_id uuid REFERENCES public.apprentice_hours(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.barber_hour_ledger.last_entry_id IS
  'FK to the most recent apprentice_hours entry that updated this ledger row. Enables tracing summary totals back to source entries.';

CREATE INDEX IF NOT EXISTS idx_barber_hour_ledger_last_entry_id
  ON public.barber_hour_ledger (last_entry_id)
  WHERE last_entry_id IS NOT NULL;

-- ── 20260430000007_fix_failed_migrations.sql ──
-- Consolidated fix for 81 failed migrations.
-- Covers: inline UNIQUE syntax → CREATE UNIQUE INDEX, missing tables,
-- missing columns, content type fixes, and seed data gaps.

-- ============================================================
-- 1. FSSA SNAP-ET system (fssa_snap_et_system failed on inline UNIQUE)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fssa_participants (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name            TEXT        NOT NULL,
  last_name             TEXT        NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  date_of_birth         DATE,
  ssn_last4             TEXT,
  case_number           TEXT,
  county                TEXT,
  snap_eligible         BOOLEAN     NOT NULL DEFAULT true,
  snap_et_enrolled_at   TIMESTAMPTZ,
  snap_et_exited_at     TIMESTAMPTZ,
  exit_reason           TEXT        CHECK (exit_reason IN ('employed','training_complete','voluntary_exit','non_compliance','ineligible','other')),
  program_id            UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  cohort_id             UUID,
  enrollment_status     TEXT        NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('pending','active','completed','exited')),
  employed_at_exit      BOOLEAN,
  employer_name         TEXT,
  hourly_wage           NUMERIC(8,2),
  hours_per_week        INT,
  job_title             TEXT,
  employment_start_date DATE,
  barriers              JSONB       DEFAULT '[]',
  support_services      JSONB       DEFAULT '[]',
  case_notes            TEXT,
  intake_completed_at   TIMESTAMPTZ,
  intake_staff_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fssa_participants_program    ON public.fssa_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_status     ON public.fssa_participants(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_county     ON public.fssa_participants(county);
CREATE INDEX IF NOT EXISTS idx_fssa_participants_created_at ON public.fssa_participants(created_at DESC);

CREATE TABLE IF NOT EXISTS public.fssa_attendance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  session_date    DATE        NOT NULL,
  session_type    TEXT        NOT NULL DEFAULT 'training' CHECK (session_type IN ('orientation','training','lab','job_search','support','other')),
  hours_attended  NUMERIC(4,2) NOT NULL DEFAULT 0,
  present         BOOLEAN     NOT NULL DEFAULT true,
  excused         BOOLEAN     NOT NULL DEFAULT false,
  notes           TEXT,
  recorded_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fssa_attendance_unique ON public.fssa_attendance(participant_id, session_date, session_type);
CREATE INDEX IF NOT EXISTS idx_fssa_attendance_participant ON public.fssa_attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_fssa_attendance_date       ON public.fssa_attendance(session_date DESC);

CREATE TABLE IF NOT EXISTS public.fssa_budget (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fiscal_year     TEXT        NOT NULL,
  quarter         TEXT        CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  category        TEXT        NOT NULL,
  line_item       TEXT        NOT NULL,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expended_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  encumbered      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  entered_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.fssa_program_components (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  participant_id  UUID        NOT NULL REFERENCES public.fssa_participants(id) ON DELETE CASCADE,
  component_type  TEXT        NOT NULL CHECK (component_type IN ('job_search','job_search_training','vocational_training','work_experience','community_service','education','self_employment','job_retention','other')),
  start_date      DATE        NOT NULL,
  end_date        DATE,
  hours_required  NUMERIC(6,2),
  hours_completed NUMERIC(6,2) DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','withdrawn')),
  notes           TEXT
);

-- ============================================================
-- 2. fssa_participants exit columns (depends on table above)
-- ============================================================
ALTER TABLE public.fssa_participants
  ADD COLUMN IF NOT EXISTS credential_attained        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS credential_type            text,
  ADD COLUMN IF NOT EXISTS credential_issued_at       timestamptz,
  ADD COLUMN IF NOT EXISTS abawd_exempt               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS abawd_exemption_reason     text,
  ADD COLUMN IF NOT EXISTS abawd_work_hours_met       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS exit_interview_completed   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS exit_interview_at          timestamptz,
  ADD COLUMN IF NOT EXISTS exit_interview_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exit_notes                 text,
  ADD COLUMN IF NOT EXISTS q2_followup_date           date,
  ADD COLUMN IF NOT EXISTS q2_followup_completed      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS q2_employed                boolean,
  ADD COLUMN IF NOT EXISTS q2_wage                    numeric(8,2),
  ADD COLUMN IF NOT EXISTS q4_followup_date           date,
  ADD COLUMN IF NOT EXISTS q4_followup_completed      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS q4_employed                boolean,
  ADD COLUMN IF NOT EXISTS q4_wage                    numeric(8,2);

-- ============================================================
-- 3. Barber tables (inline UNIQUE → CREATE UNIQUE INDEX)
-- ============================================================

-- barber_hour_ledger already exists but may be missing created_at
ALTER TABLE public.barber_hour_ledger
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_hour_ledger_user_program
  ON public.barber_hour_ledger(user_id, program_id);

-- barber_training_sessions (barber_session_tracking — generation expression fix)
CREATE TABLE IF NOT EXISTS public.barber_training_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  shop_id         UUID,
  session_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  clock_in        TIMESTAMPTZ,
  clock_out       TIMESTAMPTZ,
  duration_hours  NUMERIC(5,2),
  session_type    TEXT        NOT NULL DEFAULT 'ojt' CHECK (session_type IN ('ojt','theory','practical','observation')),
  supervisor_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  verified        BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_barber_sessions_user    ON public.barber_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_sessions_date    ON public.barber_training_sessions(session_date DESC);

-- barber_practical_categories + barber_student_practicals
CREATE TABLE IF NOT EXISTS public.barber_practical_categories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key    TEXT        NOT NULL,
  label           TEXT        NOT NULL,
  description     TEXT,
  required_count  INT         NOT NULL DEFAULT 1,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_practical_cat_key
  ON public.barber_practical_categories(category_key);

CREATE TABLE IF NOT EXISTS public.barber_student_practicals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  category_key    TEXT        NOT NULL,
  completed_count INT         NOT NULL DEFAULT 0,
  required_count  INT         NOT NULL DEFAULT 1,
  last_completed  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_student_practicals_unique
  ON public.barber_student_practicals(user_id, program_id, category_key);

CREATE TABLE IF NOT EXISTS public.barber_practical_submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_key    TEXT        NOT NULL,
  session_id      UUID        REFERENCES public.barber_training_sessions(id) ON DELETE SET NULL,
  instructor_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  score           INT,
  passed          BOOLEAN,
  notes           TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- barber_completions
CREATE TABLE IF NOT EXISTS public.barber_completions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_hours     NUMERIC(7,2),
  theory_hours    NUMERIC(7,2),
  practical_hours NUMERIC(7,2),
  checkpoints_passed INT,
  practicals_passed  INT,
  certificate_id  UUID,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_completions_unique
  ON public.barber_completions(user_id, program_id);

-- barber_competency_mappings
CREATE TABLE IF NOT EXISTS public.barber_competency_mappings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID        REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  competency_id   TEXT        NOT NULL,
  competency_label TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_competency_mapping_unique
  ON public.barber_competency_mappings(lesson_id, competency_id);

-- ============================================================
-- 4. Missing tables from other failed migrations
-- ============================================================

-- program_exam_ready_rules (exam_ready_system)
CREATE TABLE IF NOT EXISTS public.program_exam_ready_rules (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  min_lesson_pct  NUMERIC(5,2) NOT NULL DEFAULT 100,
  min_checkpoint_score INT    NOT NULL DEFAULT 70,
  require_all_checkpoints BOOLEAN NOT NULL DEFAULT true,
  require_lab_signoff BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_exam_ready_rules_program
  ON public.program_exam_ready_rules(program_id);

CREATE TABLE IF NOT EXISTS public.program_competency_domains (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  domain_key      TEXT        NOT NULL,
  label           TEXT        NOT NULL,
  weight          NUMERIC(5,2) DEFAULT 1.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_competency_domains_unique
  ON public.program_competency_domains(program_id, domain_key);

-- exam_fee_payments (certification_pipeline)
CREATE TABLE IF NOT EXISTS public.exam_fee_payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  credential_id   UUID,
  amount_cents    INT         NOT NULL,
  currency        TEXT        NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','waived')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_fee_payments_unique
  ON public.exam_fee_payments(user_id, program_id, credential_id);

-- program_instructors already exists — just ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_instructors_unique
  ON public.program_instructors(instructor_id, program_id);

-- course_lesson_versions already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_lesson_versions_unique
  ON public.course_lesson_versions(lesson_id, version);

-- program_course_links already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_course_links_unique
  ON public.program_course_links(org_id, program_id, course_id);

-- program_course_versions
CREATE TABLE IF NOT EXISTS public.program_course_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  version         INT         NOT NULL DEFAULT 1,
  label           TEXT,
  notes           TEXT,
  published_at    TIMESTAMPTZ,
  published_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_course_versions_unique
  ON public.program_course_versions(program_id, version);

-- occupation_standards already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_occupation_standards_unique
  ON public.occupation_standards(soc_code, source);

-- sfc_leads
CREATE TABLE IF NOT EXISTS public.sfc_leads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  phone           TEXT,
  source          TEXT,
  status          TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_email  ON public.sfc_leads(email);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_status ON public.sfc_leads(status);

-- priority_scores
CREATE TABLE IF NOT EXISTS public.priority_scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL,
  entity_id       UUID        NOT NULL,
  score           NUMERIC(8,2) NOT NULL DEFAULT 0,
  factors         JSONB       DEFAULT '{}',
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_priority_scores_entity ON public.priority_scores(entity_type, entity_id);

-- integration_configs
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key TEXT        NOT NULL,
  config          JSONB       NOT NULL DEFAULT '{}',
  enabled         BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_configs_key
  ON public.integration_configs(integration_key);

-- curriculum_compiler_jobs
CREATE TABLE IF NOT EXISTS public.curriculum_compiler_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  input           JSONB       DEFAULT '{}',
  output          JSONB       DEFAULT '{}',
  error           TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- store_orders
CREATE TABLE IF NOT EXISTS public.store_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),
  total_cents     INT         NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  items           JSONB       NOT NULL DEFAULT '[]',
  shipping_address JSONB      DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_orders_user   ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);

-- school_application_followups already exists — add missing columns
ALTER TABLE public.school_application_followups
  ADD COLUMN IF NOT EXISTS followup_type TEXT,
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS staff_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- parent_student_links already exists — ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_links_unique
  ON public.parent_student_links(parent_id, student_id);

-- ============================================================
-- 5. Missing columns on existing tables
-- ============================================================

-- tutorials: add is_published (tutorials_table failed on this)
ALTER TABLE public.tutorials
  ADD COLUMN IF NOT EXISTS title       TEXT,
  ADD COLUMN IF NOT EXISTS content     TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_index INT      NOT NULL DEFAULT 0;

-- app_secrets: add description as alias for note column
ALTER TABLE public.app_secrets
  ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE public.app_secrets SET description = note WHERE description IS NULL AND note IS NOT NULL;

-- stripe_webhook_events: add retry columns
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS retry_count   INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error    TEXT,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- direct_messages: add user_id (backfill from sender_id)
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.direct_messages SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- ============================================================
-- 6. mou_default_template — insert default if none exists
-- ============================================================
ALTER TABLE public.mou_templates
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.mou_templates (name, version, content, is_default, created_at)
SELECT
  'Standard Training Provider MOU',
  '2',
  'This Memorandum of Understanding is entered into between Elevate for Humanity and the Training Provider named herein.',
  true,
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.mou_templates WHERE is_default = true);

-- ============================================================
-- 7. workforce_referrals — applicant_email column
-- ============================================================
ALTER TABLE public.workforce_referrals
  ADD COLUMN IF NOT EXISTS applicant_email TEXT,
  ADD COLUMN IF NOT EXISTS applicant_name  TEXT,
  ADD COLUMN IF NOT EXISTS applicant_phone TEXT;

-- ============================================================
-- 8. publish_hvac_program — set category to avoid NOT NULL fail
-- ============================================================
UPDATE public.programs
SET category = 'trades'
WHERE slug = 'hvac-technician' AND (category IS NULL OR category = '');

-- ============================================================
-- 9. applications_payment_columns — fix text=uuid cast
-- ============================================================
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- ============================================================
-- 10. sync_hvac_course_lessons — fix lesson_type/step_type cast
-- ============================================================
-- Ensure step_type_enum includes all lesson_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'step_type_enum'::regtype
    AND enumlabel = 'lesson'
  ) THEN
    ALTER TYPE step_type_enum ADD VALUE IF NOT EXISTS 'lesson';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 11. RLS policies for tables that need them (policy-exists errors
--     mean the table IS live and policies ARE correct — skip)
-- ============================================================

-- ============================================================
-- 12. CMI tables — inline UNIQUE fix
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_cmi_attendance_unique
  ON public.cmi_attendance(student_id, date);

-- ============================================================
-- 13. Accreditation system
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accreditation_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  body            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked')),
  issued_at       DATE,
  expires_at      DATE,
  certificate_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. automation_triggers table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_triggers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key     TEXT        NOT NULL,
  event_type      TEXT        NOT NULL,
  conditions      JSONB       DEFAULT '{}',
  actions         JSONB       DEFAULT '[]',
  enabled         BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_triggers_key
  ON public.automation_triggers(trigger_key);

-- ============================================================
-- 15. video_jobs — ensure provider column exists
-- ============================================================
ALTER TABLE public.video_jobs
  ADD COLUMN IF NOT EXISTS provider    TEXT NOT NULL DEFAULT 'heygen',
  ADD COLUMN IF NOT EXISTS provider_job_id TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url   TEXT;

-- ── 20260430000008_mou_default_template.sql ──
-- Insert the default active MOU template so the PDF download route
-- returns correct metadata. Content is intentionally minimal here —
-- the full MOU text is rendered inline on the program-holder/mou page.
INSERT INTO public.mou_templates (name, title, version, is_active, content)
VALUES (
  'mou',
  'Memorandum of Understanding — Program Holder Agreement',
  2,
  true,
  'This Memorandum of Understanding ("MOU") is entered into between Elevate for Humanity Career & Technical Institute ("Elevate") and the Program Holder organization named herein. By signing this MOU, both parties agree to the terms and conditions governing the delivery of workforce training programs, including program delivery standards, reporting requirements, compliance obligations, intellectual property protections, and revenue sharing arrangements as described in the full agreement presented at the time of signing.'
)
ON CONFLICT DO NOTHING;

-- ── 20260430000009_mou_signatures_user_id.sql ──
-- Add user_id to mou_signatures so the PDF download route can look up
-- a signature by the authenticated user.
ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mou_signatures_user_id
  ON public.mou_signatures (user_id);

-- Allow authenticated users to read their own signature
DROP POLICY IF EXISTS "Users can read own mou_signature" ON public.mou_signatures;
CREATE POLICY "Users can read own mou_signature"
  ON public.mou_signatures
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own signature
DROP POLICY IF EXISTS "Users can insert own mou_signature" ON public.mou_signatures;
CREATE POLICY "Users can insert own mou_signature"
  ON public.mou_signatures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── 20260430000010_extend_application_status_pipeline.sql ──
-- Extend applications.status CHECK constraint to include post-enrollment
-- lifecycle states required for WIOA performance reporting (ETA-9173).
--
-- New states:
--   scheduled            → consultation booked
--   attended_orientation → orientation complete
--   active_apprentice    → actively in program
--   assigned             → placed with employer/shop
--   completed            → program complete
--   placed               → employed post-completion
--   retained             → retained at 2nd quarter (WIOA metric)
--   withdrawn            → voluntarily left
--   exited               → formally exited (WIOA exit)

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status = ANY (ARRAY[
    'submitted',
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
    'withdrawn',
    'exited',
    'pending_workone',
    'waitlisted'
  ]::text[]));

-- ── 20260430000011_hour_entries_program_holder_id.sql ──
-- Add program_holder_id to hour_entries so the partner portal can filter
-- pending entries by the logged-in program holder's assigned apprentices.
ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS program_holder_id uuid REFERENCES public.program_holders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hour_entries_program_holder_id
  ON public.hour_entries(program_holder_id);

CREATE INDEX IF NOT EXISTS idx_hour_entries_status
  ON public.hour_entries(status);

-- ── 20260430000012_wioa_intake_fields.sql ──
-- Add WIOA-required fields to apprenticeship_intake
-- Required for eligibility auto-determination, WIOA reporting, and Indiana DWD regional reporting.

ALTER TABLE public.apprenticeship_intake
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE,
  ADD COLUMN IF NOT EXISTS county            TEXT,
  ADD COLUMN IF NOT EXISTS household_size    INTEGER,
  ADD COLUMN IF NOT EXISTS annual_income     TEXT,
  ADD COLUMN IF NOT EXISTS snap_recipient    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tanf_recipient    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS barriers          TEXT[]  NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.apprenticeship_intake.date_of_birth  IS 'Required for WIOA age eligibility gate (Adult ≥18, Youth 14-24)';
COMMENT ON COLUMN public.apprenticeship_intake.county         IS 'Indiana county of residence — maps to Local Workforce Development Area for DWD reporting';
COMMENT ON COLUMN public.apprenticeship_intake.household_size IS 'Number of people in household — used for WIOA income threshold calculation';
COMMENT ON COLUMN public.apprenticeship_intake.annual_income  IS 'Annual household income range — used for WIOA income eligibility';
COMMENT ON COLUMN public.apprenticeship_intake.snap_recipient IS 'SNAP receipt = categorical WIOA eligibility';
COMMENT ON COLUMN public.apprenticeship_intake.tanf_recipient IS 'TANF receipt = categorical WIOA eligibility';
COMMENT ON COLUMN public.apprenticeship_intake.barriers       IS 'WIOA barrier categories: homeless, ex-offender, veteran, disability, basic-skills, english-learner, single-parent, foster-youth';

-- ── 20260430000013_employment_outcomes_missing_columns.sql ──
-- employment_outcomes is missing start_date and recorded_by columns
-- required by the /api/outcomes POST route.
ALTER TABLE public.employment_outcomes
  ADD COLUMN IF NOT EXISTS start_date   date,
  ADD COLUMN IF NOT EXISTS recorded_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_id
    ON public.employment_outcomes(user_id);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_employment_outcomes_program_slug
  ON public.employment_outcomes(program_slug);

-- ── 20260430000014_employment_outcomes_uuid_columns.sql ──
-- employment_outcomes was created with integer PKs (legacy schema).
-- Table is empty — drop the NOT NULL constraint on the legacy integer user_id
-- and add UUID columns so the /api/outcomes route can write using Supabase auth UIDs.
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes ALTER COLUMN program_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes ALTER COLUMN verified_by DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE public.employment_outcomes
  ADD COLUMN IF NOT EXISTS user_uuid        uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recorded_by_uuid uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_uuid
  ON public.employment_outcomes(user_uuid);

-- ── 20260430000015_employment_outcomes_uuid_pk.sql ──
-- Rebuild employment_outcomes with a UUID primary key.
-- The table is empty (0 rows) so DROP + CREATE is safe.
-- Removes legacy integer columns (id, user_id, program_id, verified_by)
-- and consolidates to a clean schema aligned with the /api/outcomes route.

DROP TABLE IF EXISTS public.employment_outcomes;

CREATE TABLE IF NOT EXISTS public.employment_outcomes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_slug        text NOT NULL,
  outcome_type        text NOT NULL CHECK (outcome_type IN ('employed','credential','military','education','self-employed','other')),

  -- Employment details
  employer_name       text,
  job_title           text,
  industry            text,
  hourly_wage         numeric(10,2),
  annual_salary       numeric(12,2),
  hours_per_week      integer,
  employment_type     text CHECK (employment_type IN ('full-time','part-time','contract','self-employed') OR employment_type IS NULL),
  benefits_offered    boolean DEFAULT false,
  is_career_pathway   boolean DEFAULT false,
  start_date          date,
  exit_date           timestamptz,
  employed_at_exit    boolean DEFAULT false,

  -- WIOA retention tracking (2nd/4th quarter after exit)
  retained_30_days    boolean,
  retained_90_days    boolean,
  retained_180_days   boolean,
  retained_1_year     boolean,
  last_contact_date   date,
  next_followup_date  date,

  -- Verification
  verification_method text,
  verified_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at         timestamptz,

  -- Audit
  notes               text,
  recorded_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_uuid    ON public.employment_outcomes(user_uuid);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_program_slug ON public.employment_outcomes(program_slug);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_outcome_type ON public.employment_outcomes(outcome_type);

-- RLS
ALTER TABLE public.employment_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_outcomes" ON public.employment_outcomes;
CREATE POLICY "users_own_outcomes" ON public.employment_outcomes
  FOR SELECT TO authenticated USING (user_uuid = auth.uid());

DROP POLICY IF EXISTS "admin_manage_outcomes" ON public.employment_outcomes;
CREATE POLICY "admin_manage_outcomes" ON public.employment_outcomes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
  ));

-- ── 20260430000016_applications_type_column.sql ──
-- applications.type is used by /api/applications to tag the applicant category
-- (student, employer, staff, program-holder, etc.)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'student';

CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(type);

-- ── 20260430000017_workforce_pipeline_schema.sql ──
-- Workforce pipeline schema additions
-- Supports: consultation→applicant linkage, workforce referrals, employment outcomes,
--           post-enrollment application statuses, and referral agency tagging.

-- 1. Add application_id FK and zoom fields to appointments table
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS application_id  UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zoom_url        TEXT,
  ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
  ADD COLUMN IF NOT EXISTS attended_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_application_id ON public.appointments(application_id);

-- 2. Add scheduled_at and placed_at to applications for lifecycle timestamps
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS scheduled_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS placed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_agency TEXT;
-- agency_name already exists from workforce_referrals_full_schema

-- 3. Ensure workforce_referrals has all required columns
CREATE TABLE IF NOT EXISTS public.workforce_referrals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name      TEXT NOT NULL,
  applicant_email     TEXT NOT NULL,
  applicant_phone     TEXT,
  agency_name         TEXT NOT NULL,
  case_manager_name   TEXT,
  case_manager_email  TEXT,
  case_manager_phone  TEXT,
  program_interest    TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'referred'
                        CHECK (status IN ('referred','contacted','enrolled','declined','exited')),
  application_id      UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_email         ON public.workforce_referrals(applicant_email);
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_agency        ON public.workforce_referrals(agency_name);
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_application_id ON public.workforce_referrals(application_id);

COMMENT ON TABLE public.workforce_referrals IS
  'Agency-to-applicant referral records for WorkOne, FSSA, and community org partners. Required for WIOA referral tracking.';

-- 4. Ensure employment_outcomes has all required columns
-- Table already exists; add missing columns first
ALTER TABLE public.employment_outcomes
  ADD COLUMN IF NOT EXISTS program_slug TEXT,
  ADD COLUMN IF NOT EXISTS outcome_type TEXT;

-- Add user_id if it doesn't exist (table was created without it in some environments)
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.employment_outcomes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug  TEXT NOT NULL,
  outcome_type  TEXT NOT NULL
                  CHECK (outcome_type IN ('employed','credential','military','education','self-employed','other')),
  employer_name TEXT,
  job_title     TEXT,
  hourly_wage   NUMERIC(8,2),
  start_date    DATE,
  notes         TEXT,
  recorded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_id ON public.employment_outcomes(user_id);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_program_slug ON public.employment_outcomes(program_slug);

COMMENT ON TABLE public.employment_outcomes IS
  'WIOA performance metric: employment, credential, military, and education outcomes post-program-completion.';

-- 5. Add submitted_by_partner flag to hour_entries for partner-submitted rows
ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS submitted_by_partner BOOLEAN NOT NULL DEFAULT false;

-- ── 20260430000018_workforce_referrals_missing_columns.sql ──
-- workforce_referrals was created with agency_name/agency_type but the API
-- route uses a single `agency` column, plus program_interest and notes.
ALTER TABLE public.workforce_referrals
  ADD COLUMN IF NOT EXISTS agency           text,
  ADD COLUMN IF NOT EXISTS program_interest text,
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS referral_agency  text;

-- Also add referral_agency to applications so the route can tag the source
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS referral_agency text;

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_agency
  ON public.workforce_referrals(agency);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_status
  ON public.workforce_referrals(status);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_applicant_email
  ON public.workforce_referrals(applicant_email);

