import { Suspense } from 'react';
import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // cache dashboard data for 60s — reduces DB load

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Auth and role enforcement is handled by apps/admin/app/admin/layout.tsx.
// No redundant requireAdmin() here — it added 3 extra DB round-trips per load
// and threw ERR_DASHBOARD_LOAD when NEXT_PUBLIC_ADMIN_URL was missing.
async function DashboardContent() {
  let data;
  try {
    data = await getAdminDashboardData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw Object.assign(new Error(`Dashboard data load failed: ${msg}`), { digest: 'ERR_DASHBOARD_LOAD' });
  }
  return <AdminDashboardContent data={data} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
