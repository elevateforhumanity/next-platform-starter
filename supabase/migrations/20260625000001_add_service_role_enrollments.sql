-- Fix: Add service_role policy to program_enrollments
-- The admin dashboard uses service_role client which currently gets "permission denied"
-- because no RLS policy allows service_role access.

-- Add service_role full access policy
DROP POLICY IF EXISTS "service_role_enrollments_all" ON public.program_enrollments;
CREATE POLICY "service_role_enrollments_all" ON public.program_enrollments
  FOR ALL USING (auth.role() = 'service_role');

-- Also add service_role to profiles (needed for recent_students query)
DROP POLICY IF EXISTS "service_role_profiles_all" ON public.profiles;
CREATE POLICY "service_role_profiles_all" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');
