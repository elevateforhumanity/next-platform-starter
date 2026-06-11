import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import { DashboardPageGuard } from '@/components/admin/dashboard/DashboardPageGuard';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { PERMISSIONS } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Auth and role enforcement is handled by apps/admin/app/admin/layout.tsx.
export default async function AdminDashboardPage() {
  let data;
  try {
    data = normalizeAdminDashboardData(await getAdminDashboardData());
  } catch (err) {
    logger.error('[AdminDashboardPage] Dashboard data load failed; rendering degraded dashboard', err);
    data = normalizeAdminDashboardData(getDegradedAdminDashboardData());
  }

  // Check if current user can access Dev Studio (for hiding the card).
  let canAccessDevStudio = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('user_roles').select('role, roles(name)').eq('user_id', user.id),
      ]);
      const roles = Array.from(new Set([
        profile?.role,
        ...(roleRows || []).flatMap((r: any) => [r.roles?.name, r.role]),
      ].filter((v): v is string => typeof v === 'string' && v.trim() !== '')));
      canAccessDevStudio = roles.some((r) => PERMISSIONS.access_devstudio.includes(r as any));
    }
  } catch { /* degrade gracefully — hide Dev Studio card */ }

  return (
    <DashboardPageGuard>
      <AdminDashboardContent data={data} canAccessDevStudio={canAccessDevStudio} />
    </DashboardPageGuard>
  );
}
