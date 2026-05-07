-- Performance indexes for admin dashboard and public site queries.
--
-- Problems addressed:
--   1. program_enrollments: no index on payment_status, created_at, or
--      (payment_status, created_at) — revenue queries do full table scans.
--   2. program_enrollments: no index on (enrollment_state, created_at) —
--      active enrollment count and trend queries scan the full table.
--   3. leads: no index on updated_at — stale-leads query can't use the filter.
--   4. enrollment_funding_records: no index on enrollment_id — the LATERAL
--      join in participant_report scans the full table per enrollment row.
--   5. placement_records: no index on learner_id — same LATERAL join issue.
--   6. program_completion_certificates: no index on (user_id, program_id) —
--      same LATERAL join issue.
--   7. applications: no composite index on (status, created_at) — stalled
--      applications query filters both columns.

-- ── program_enrollments ───────────────────────────────────────────────────────

-- Revenue queries: WHERE payment_status IN (...) [+ optional created_at range]
CREATE INDEX IF NOT EXISTS idx_pe_payment_status
  ON public.program_enrollments (payment_status)
  WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pe_payment_status_created
  ON public.program_enrollments (payment_status, created_at DESC)
  WHERE payment_status IS NOT NULL;

-- Enrollment trend: WHERE created_at >= ... ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_pe_created_at
  ON public.program_enrollments (created_at DESC);

-- Active enrollment count + inactive learner list
CREATE INDEX IF NOT EXISTS idx_pe_state_created
  ON public.program_enrollments (enrollment_state, created_at DESC);

-- Today's new enrollments
CREATE INDEX IF NOT EXISTS idx_pe_state_user
  ON public.program_enrollments (enrollment_state, user_id)
  WHERE enrollment_state = 'active';

-- ── leads ─────────────────────────────────────────────────────────────────────

-- Stale leads: WHERE status NOT IN (...) AND updated_at < threshold
CREATE INDEX IF NOT EXISTS idx_leads_updated_at
  ON public.leads (updated_at ASC)
  WHERE status NOT IN ('closed_won', 'closed_lost');

-- ── enrollment_funding_records ────────────────────────────────────────────────

-- participant_report LATERAL: WHERE efr2.enrollment_id = pe.id ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_efr_enrollment_created
  ON public.enrollment_funding_records (enrollment_id, created_at DESC);

-- ── placement_records ─────────────────────────────────────────────────────────

-- participant_report LATERAL: WHERE pl2.learner_id = pe.user_id ORDER BY start_date DESC
CREATE INDEX IF NOT EXISTS idx_placement_learner_start
  ON public.placement_records (learner_id, start_date DESC);

-- ── program_completion_certificates ──────────────────────────────────────────

-- participant_report LATERAL: WHERE cert2.user_id = pe.user_id AND cert2.program_id = pg.id
CREATE INDEX IF NOT EXISTS idx_pcc_user_program
  ON public.program_completion_certificates (user_id, program_id);

-- ── applications ──────────────────────────────────────────────────────────────

-- Stalled applications: WHERE status IN (...) AND created_at < threshold
CREATE INDEX IF NOT EXISTS idx_applications_status_created
  ON public.applications (status, created_at ASC)
  WHERE status IN ('submitted', 'pending', 'in_review');
