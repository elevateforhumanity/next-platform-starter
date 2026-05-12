-- ============================================================
-- ELEVATE LMS — ACCOUNT CLEANUP
-- Run this in Supabase Dashboard → SQL Editor
-- 
-- KEEPS these 10 accounts:
--   fletcheraustin98@gmail.com      (HVAC student)
--   pedroverajr1125@gmail.com       (HVAC student)
--   natataroa@gmail.com             (Barber student)
--   jbwhite888@icloud.com           (Barber student)
--   msanqin@gmail.com               (Barber student)
--   adamkriech1@gmail.com           (Partner — Kountry Kutz)
--   elizabethpowell6262@gmail.com   (Program holder)
--   elizabthpowell6262@gmail.com    (Super admin)
--   elevate4humanityedu@gmail.com   (Elevate super admin)
--   curvaturebodysculpting@gmail.com (Elevate admin)
--
-- DELETES everyone else
-- REMOVES all enrollments except Austin/Pedro (HVAC) + Natalia/Jordan/Mercedes (Barber)
-- ============================================================

DO $$
DECLARE
  keep_ids UUID[] := ARRAY[
    '9feda5bd-c30b-458d-a22e-4890a1240336'::uuid,  -- Austin Fletcher
    '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77'::uuid,  -- Pedro Carpintero
    '2d761d18-6ff9-4355-b9dd-5ff55903906b'::uuid,  -- Natalia Roa
    'b35f3289-614b-4c6e-b029-73617fc46655'::uuid,  -- Jordan White
    '70483e3b-30f1-4c58-8046-d068ab7356ee'::uuid,  -- Mercedes Wellington
    '5f20c09c-7fd5-4aac-b2d2-aef12b78fbb2'::uuid,  -- Adam Kriech (Kountry Kutz)
    '8e352e99-d552-4690-b8e7-8a560bb1f873'::uuid,  -- Elizabeth Greene (program_holder)
    '4994cf7e-98dc-4337-968b-243957fff6c9'::uuid,  -- Elizabeth L. Greene (super_admin)
    'b543fa81-69d4-4d6e-995a-e570e2aed0d2'::uuid,  -- elevate4humanityedu@gmail.com
    '964dc85a-bce8-4e67-92eb-198ffafb2384'::uuid   -- curvaturebodysculpting@gmail.com
  ];

  student_ids UUID[] := ARRAY[
    '9feda5bd-c30b-458d-a22e-4890a1240336'::uuid,  -- Austin Fletcher (HVAC)
    '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77'::uuid,  -- Pedro Carpintero (HVAC)
    '2d761d18-6ff9-4355-b9dd-5ff55903906b'::uuid,  -- Natalia Roa (Barber)
    'b35f3289-614b-4c6e-b029-73617fc46655'::uuid,  -- Jordan White (Barber)
    '70483e3b-30f1-4c58-8046-d068ab7356ee'::uuid   -- Mercedes Wellington (Barber)
  ];

  del_count int;
BEGIN
  RAISE NOTICE 'Starting Elevate LMS account cleanup...';

  -- ── Step 1: Remove enrollments for non-student or non-enrolled users ──────
  DELETE FROM public.program_enrollments
  WHERE user_id != ALL(student_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Removed % program_enrollments', del_count;

  DELETE FROM public.training_enrollments
  WHERE user_id != ALL(student_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Removed % training_enrollments', del_count;

  DELETE FROM public.student_enrollments
  WHERE user_id != ALL(student_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Removed % student_enrollments', del_count;

  -- enrollments legacy view — references same table but delete from source
  DELETE FROM public.enrollments
  WHERE user_id != ALL(student_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Removed % legacy enrollments', del_count;

  -- ── Step 2: Delete lesson progress / quiz data for removed users ─────────
  DELETE FROM public.lesson_progress         WHERE user_id != ALL(keep_ids);
  DELETE FROM public.checkpoint_scores       WHERE user_id != ALL(keep_ids);
  DELETE FROM public.step_submissions        WHERE user_id != ALL(keep_ids);
  DELETE FROM public.quiz_attempts           WHERE user_id != ALL(keep_ids);
  DELETE FROM public.program_completion_certificates WHERE user_id != ALL(keep_ids);
  DELETE FROM public.exam_funding_authorizations    WHERE user_id != ALL(keep_ids);
  DELETE FROM public.barber_lesson_progress  WHERE user_id != ALL(keep_ids);
  DELETE FROM public.barber_subscriptions    WHERE user_id != ALL(keep_ids);
  RAISE NOTICE 'Cleared learning progress for removed users';

  -- ── Step 3: Delete other per-user records ─────────────────────────────────
  DELETE FROM public.notifications           WHERE user_id != ALL(keep_ids);
  DELETE FROM public.documents               WHERE user_id != ALL(keep_ids);
  DELETE FROM public.case_manager_assignments WHERE user_id != ALL(keep_ids);
  DELETE FROM public.mous                    WHERE user_id != ALL(keep_ids);
  RAISE NOTICE 'Cleared notifications/documents for removed users';

  -- ── Step 4: Clear audit_logs that reference removed users ─────────────────
  -- (audit_logs.actor_id has a FK to auth.users — must be removed first)
  DELETE FROM public.audit_logs WHERE actor_id != ALL(keep_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Removed % audit_log rows', del_count;

  -- ── Step 5: Delete profiles for removed users ─────────────────────────────
  DELETE FROM public.profiles WHERE id != ALL(keep_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Removed % profiles', del_count;

  -- ── Step 6: Delete auth users ─────────────────────────────────────────────
  DELETE FROM auth.users WHERE id != ALL(keep_ids);
  GET DIAGNOSTICS del_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % auth users', del_count;

  RAISE NOTICE 'Done. % accounts remain.', array_length(keep_ids, 1);
END $$;

-- ── Verify what remains ───────────────────────────────────────────────────────
SELECT
  p.role,
  p.full_name,
  p.email,
  u.last_sign_in_at::date AS last_login
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.role, p.full_name;
