-- Enable RLS on attendance_sessions and scope to host.
-- Table had RLS disabled — any authenticated user could read all sessions.

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY host_own_sessions ON public.attendance_sessions
  FOR ALL
  USING  (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY admin_all_sessions ON public.attendance_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );
