-- RPC: admin_inactive_learners
--
-- Replaces the JS-side inactive learner detection in get-admin-dashboard-data.ts
-- which fetched 100 active enrollment rows then did a second query per learner.
-- Now runs a single LEFT JOIN against lesson_progress server-side, filtering
-- to learners with no activity in the last 3 days.

CREATE OR REPLACE FUNCTION public.admin_inactive_learners(
  p_inactive_days INT DEFAULT 3,
  p_limit         INT DEFAULT 20
)
RETURNS TABLE (
  enrollment_id UUID,
  user_id       UUID,
  program_id    UUID,
  enrolled_at   TIMESTAMPTZ,
  full_name     TEXT,
  email         TEXT,
  last_activity TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pe.id                                     AS enrollment_id,
    pe.user_id,
    pe.program_id,
    COALESCE(pe.confirmed_at, pe.created_at)  AS enrolled_at,
    pr.full_name,
    pr.email,
    MAX(lp.updated_at)                        AS last_activity
  FROM public.program_enrollments pe
  LEFT JOIN public.profiles pr
    ON pr.id = pe.user_id
  LEFT JOIN public.lesson_progress lp
    ON lp.user_id = pe.user_id
  WHERE pe.enrollment_state = 'active'
    AND pe.user_id IS NOT NULL
  GROUP BY pe.id, pe.user_id, pe.program_id, pe.confirmed_at, pe.created_at, pr.full_name, pr.email
  HAVING MAX(lp.updated_at) IS NULL
      OR MAX(lp.updated_at) < NOW() - (p_inactive_days || ' days')::INTERVAL
  ORDER BY last_activity ASC NULLS FIRST
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.admin_inactive_learners(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_inactive_learners(INT, INT) TO service_role;
