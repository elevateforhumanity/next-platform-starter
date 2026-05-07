-- 20260629000004_cleanup_intake_timestamp_ids.sql
--
-- Remove legacy applications rows whose id starts with 'intake-'.
-- These were created by an old version of /api/intake/route.ts that used
-- `intake-${Date.now()}` as a fallback ID when the mirror insert returned
-- no row. The bug was fixed — real mirrors now always produce UUID ids.
--
-- These rows cannot be reviewed (the review page requires a UUID), are not
-- linked to any enrollment, and duplicate data already in apprenticeship_intake.
--
-- Safe to delete: no FK references point to non-UUID application ids.

-- Preview first (run this SELECT to confirm before deleting):
-- SELECT id, email, program_interest, created_at
-- FROM public.applications
-- WHERE id LIKE 'intake-%'
-- ORDER BY created_at DESC;

DELETE FROM public.applications
WHERE id LIKE 'intake-%';
