-- Security hardening: SECURITY DEFINER functions missing search_path
--
-- Risk: without a fixed search_path, a SECURITY DEFINER function can be
-- exploited via search_path injection — an attacker creates a shadow object
-- in a schema that appears before public, causing the function to call
-- attacker-controlled code with elevated privileges.
--
-- Fix: set search_path = public on all affected functions.
-- Additionally revoke anon EXECUTE on functions that have no legitimate
-- public/unauthenticated use case.
--
-- Applied: manually via Supabase Dashboard SQL Editor.

-- ── 1. Fix search_path on all 34 affected SECURITY DEFINER functions ─────────

ALTER FUNCTION public._tmp_get_triggers()
  SET search_path = public;

ALTER FUNCTION public.approve_application_and_grant_access_atomic(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.approve_barber_practical(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.archive_stale_applications(integer)
  SET search_path = public;

ALTER FUNCTION public.audit_enrollment_insert()
  SET search_path = public;

ALTER FUNCTION public.audit_trigger_fn()
  SET search_path = public;

ALTER FUNCTION public.auto_create_exam_authorization()
  SET search_path = public;

ALTER FUNCTION public.block_direct_enrollment_insert()
  SET search_path = public;

ALTER FUNCTION public.can_publish_course(uuid)
  SET search_path = public;

ALTER FUNCTION public.check_application_access_readiness(uuid)
  SET search_path = public;

ALTER FUNCTION public.cleanup_expired_ai_memory()
  SET search_path = public;

ALTER FUNCTION public.decrement_slot_booked_count(uuid)
  SET search_path = public;

ALTER FUNCTION public.devstudio_append_log(uuid, text[])
  SET search_path = public;

ALTER FUNCTION public.enforce_course_content_before_publish()
  SET search_path = public;

ALTER FUNCTION public.enroll_application(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.enroll_application(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.escalate_funding_verification_sla()
  SET search_path = public;

ALTER FUNCTION public.escalate_overdue_funding_verifications()
  SET search_path = public;

ALTER FUNCTION public.evaluate_exam_readiness(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.get_revenue_all_time()
  SET search_path = public;

ALTER FUNCTION public.get_revenue_last_month()
  SET search_path = public;

ALTER FUNCTION public.increment_slot_booked_count(uuid)
  SET search_path = public;

ALTER FUNCTION public.is_admin_role()
  SET search_path = public;

ALTER FUNCTION public.is_program_completion_eligible(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.maybe_issue_certificate_after_checkpoint_score()
  SET search_path = public;

ALTER FUNCTION public.maybe_issue_certificate_after_lesson_progress()
  SET search_path = public;

ALTER FUNCTION public.my_tenant_id()
  SET search_path = public;

ALTER FUNCTION public.revoke_application_access_atomic(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.rpc_enroll_student(uuid, uuid, text, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.snapshot_course_version(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.sync_progress_to_hour_entries()
  SET search_path = public;

ALTER FUNCTION public.upsert_stripe_session(text, text, text, integer, text, timestamptz, text, text, text, text, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.wioa_summary_metrics(date, date, uuid, text)
  SET search_path = public;

-- submit_program_holder_application — non-anon, fix search_path only
ALTER FUNCTION public.submit_program_holder_application(text, text, text, text, text, uuid, text, text, text, text, text, text, text)
  SET search_path = public;


-- ── 2. Revoke anon EXECUTE on functions with no public use case ───────────────
-- These are admin/internal operations that should never be callable by
-- unauthenticated users. RLS alone is not sufficient when SECURITY DEFINER
-- bypasses row-level policies.

-- Admin/internal operations
REVOKE EXECUTE ON FUNCTION public.archive_stale_applications(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.escalate_funding_verification_sla() FROM anon;
REVOKE EXECUTE ON FUNCTION public.escalate_overdue_funding_verifications() FROM anon;
REVOKE EXECUTE ON FUNCTION public.wioa_summary_metrics(date, date, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.devstudio_append_log(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_course_version(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_ai_memory() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_revenue_all_time() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_revenue_last_month() FROM anon;
REVOKE EXECUTE ON FUNCTION public._tmp_get_triggers() FROM anon;

-- Enrollment/application operations — require authenticated user
REVOKE EXECUTE ON FUNCTION public.enroll_application(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enroll_application(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpc_enroll_student(uuid, uuid, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_application_access_atomic(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_barber_practical(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_application_access_readiness(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_exam_readiness(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_program_completion_eligible(uuid, uuid) FROM anon;

-- Payment operations
REVOKE EXECUTE ON FUNCTION public.upsert_stripe_session(text, text, text, integer, text, timestamptz, text, text, text, text, text, jsonb) FROM anon;

-- Course/content operations — require authenticated user
REVOKE EXECUTE ON FUNCTION public.can_publish_course(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_course_content_before_publish() FROM anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_course_version(uuid, uuid, text) FROM anon;

-- Slot management — require authenticated user
REVOKE EXECUTE ON FUNCTION public.increment_slot_booked_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_slot_booked_count(uuid) FROM anon;

-- Certificate/progress triggers — internal, called by trigger not directly
REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate_after_checkpoint_score() FROM anon;
REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate_after_lesson_progress() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_progress_to_hour_entries() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_create_exam_authorization() FROM anon;

-- Keep anon access on:
--   is_admin_role()         — used in RLS policies, must be callable
--   my_tenant_id()          — used in RLS policies, must be callable
--   audit_trigger_fn()      — trigger function, called by DB not users
--   audit_enrollment_insert() — trigger function
--   block_direct_enrollment_insert() — trigger function
