import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import { DashboardPageGuard } from '@/components/admin/dashboard/DashboardPageGuard';
import { logger } from '@/lib/logger';

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
  return (
    <DashboardPageGuard>
      <AdminDashboardContent data={data} />
    </DashboardPageGuard>
  );
}
