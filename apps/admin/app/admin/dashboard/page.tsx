import { Suspense } from 'react';
import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';

import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Fetches data independently so the admin shell (nav, idle guard) renders
// immediately from the layout while this streams in via Suspense.
async function DashboardContent() {
  let data;
  try {
    data = await getAdminDashboardData();
  } catch (err) {
    // Surface a typed error so the error boundary digest is meaningful
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw Object.assign(new Error(`Dashboard data load failed: ${msg}`), { digest: 'ERR_DASHBOARD_LOAD' });
  }
  return <AdminDashboardContent data={data} />;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
