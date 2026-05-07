-- RPC: admin_revenue_summary
--
-- Replaces 3 separate full-row fetches in get-admin-dashboard-data.ts that
-- pulled all amount_paid_cents rows and summed them in JavaScript.
-- Now runs a single query with conditional aggregation — one round-trip,
-- no row transfer, uses the new idx_pe_payment_status_created index.

CREATE OR REPLACE FUNCTION public.admin_revenue_summary(
  p_month_start      TIMESTAMPTZ,
  p_last_month_start TIMESTAMPTZ,
  p_last_month_end   TIMESTAMPTZ
)
RETURNS TABLE (
  all_time_cents        BIGINT,
  this_month_cents      BIGINT,
  last_month_cents      BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(amount_paid_cents), 0)::BIGINT                                                          AS all_time_cents,
    COALESCE(SUM(amount_paid_cents) FILTER (WHERE created_at >= p_month_start), 0)::BIGINT               AS this_month_cents,
    COALESCE(SUM(amount_paid_cents) FILTER (WHERE created_at >= p_last_month_start
                                              AND created_at <  p_last_month_end), 0)::BIGINT            AS last_month_cents
  FROM public.program_enrollments
  WHERE payment_status IN ('paid', 'completed', 'setup_fee_paid');
$$;

GRANT EXECUTE ON FUNCTION public.admin_revenue_summary(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revenue_summary(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
