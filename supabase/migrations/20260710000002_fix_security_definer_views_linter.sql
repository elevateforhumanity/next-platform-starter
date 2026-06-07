-- Fix Supabase linter 0010_security_definer_view for participant_report and program_catalog_index.
-- Earlier migrations recreated these views without security_invoker=true.
-- Idempotent — safe to re-run in Supabase SQL Editor.

-- ── participant_report ────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.participant_report CASCADE;

CREATE VIEW public.participant_report
WITH (security_invoker = true)
AS
SELECT
  pe.id,
  pe.user_id,
  pe.student_id,
  pe.program_id,
  pe.enrollment_state AS enrollment_status,
  pe.enrollment_state,
  pe.created_at AS applied_at,
  pe.created_at,
  pe.updated_at,
  pr.first_name,
  pr.last_name,
  pr.email,
  pr.phone,
  pg.title AS program_title,
  pg.slug AS program_slug,
  pg.title AS program_category
FROM public.program_enrollments pe
LEFT JOIN public.profiles pr ON pr.id = COALESCE(pe.user_id, pe.student_id)
LEFT JOIN public.programs pg ON pg.id = pe.program_id;

GRANT SELECT ON public.participant_report TO authenticated, service_role;

COMMENT ON VIEW public.participant_report IS
  'WIOA participant report — security_invoker=true (caller RLS applies).';

-- ── program_catalog_index (programs-only, matches 20260705000011) ───────────
DROP VIEW IF EXISTS public.program_catalog_index CASCADE;

CREATE VIEW public.program_catalog_index
WITH (security_invoker = true)
AS
SELECT
  p.id                                              AS program_id,
  p.id,
  p.slug,
  p.title,
  COALESCE(NULLIF(btrim(p.partner_name), ''), 'Elevate for Humanity') AS provider_name,
  COALESCE(t.slug, 'elevate')                       AS provider_slug,
  p.category,
  p.category_norm,
  p.description,
  p.excerpt,
  p.image_url,
  p.estimated_weeks                                 AS duration_weeks,
  p.estimated_weeks,
  p.credential_name,
  p.credential_type,
  p.funding_tags,
  COALESCE(p.wioa_approved, p.funding_eligible, false) AS wioa_eligible,
  p.wioa_approved,
  p.published,
  p.is_active,
  p.status,
  p.featured,
  p.state_code                                      AS state,
  p.completion_rate,
  p.placement_rate,
  p.delivery_method                                 AS delivery_mode,
  'program'::text                                   AS source_type,
  p.short_description
FROM public.programs p
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE p.published = true
  AND p.is_active = true
  AND (p.status IS NULL OR p.status <> 'archived');

GRANT SELECT ON public.program_catalog_index TO authenticated, anon, service_role;

COMMENT ON VIEW public.program_catalog_index IS
  'Published programs catalog — security_invoker=true; anon SELECT via GRANT + underlying RLS.';
