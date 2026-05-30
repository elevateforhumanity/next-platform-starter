-- Learner-scoped writes for checkpoint_scores and program_completion_certificates.
-- Enables authenticated RPC calls so service_role is not required for the learner path.
-- Apply after 20260327000003_checkpoint_gating.sql (tables must exist).
--
-- Does NOT enable FORCE ROW SECURITY — service_role admin overrides remain valid until
-- all privileged admin paths are migrated.

BEGIN;

-- ─── checkpoint_scores: tighten authenticated policies ───────────────────────

DROP POLICY IF EXISTS "users_own_checkpoint_scores" ON public.checkpoint_scores;
DROP POLICY IF EXISTS "users_insert_own_checkpoint_scores" ON public.checkpoint_scores;
DROP POLICY IF EXISTS "users_select_own_checkpoint_scores" ON public.checkpoint_scores;

CREATE POLICY "users_select_own_checkpoint_scores"
  ON public.checkpoint_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_checkpoint_scores"
  ON public.checkpoint_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─── record_checkpoint_attempt (SECURITY DEFINER) ─────────────────────────────

CREATE OR REPLACE FUNCTION public.record_checkpoint_attempt(
  p_lesson_id uuid,
  p_course_id uuid,
  p_module_order integer,
  p_score integer,
  p_passing_score integer,
  p_answers jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_attempt integer;
  v_passed boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'invalid_score';
  END IF;

  SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_attempt
    FROM public.checkpoint_scores
   WHERE user_id = v_user_id
     AND lesson_id = p_lesson_id;

  v_passed := p_score >= p_passing_score;

  INSERT INTO public.checkpoint_scores (
    user_id,
    lesson_id,
    course_id,
    module_order,
    score,
    passing_score,
    attempt_number,
    answers
  ) VALUES (
    v_user_id,
    p_lesson_id,
    p_course_id,
    GREATEST(COALESCE(p_module_order, 1), 1),
    p_score,
    p_passing_score,
    v_attempt,
    COALESCE(p_answers, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'lessonId', p_lesson_id,
    'score', p_score,
    'passed', v_passed,
    'passingScore', p_passing_score,
    'attemptNumber', v_attempt
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, integer, integer, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, integer, integer, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, integer, integer, integer, jsonb) TO service_role;

-- ─── program_completion_certificates: authenticated insert for self ─────────

DROP POLICY IF EXISTS "users_insert_own_completion_certs" ON public.program_completion_certificates;

CREATE POLICY "users_insert_own_completion_certs"
  ON public.program_completion_certificates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMIT;
