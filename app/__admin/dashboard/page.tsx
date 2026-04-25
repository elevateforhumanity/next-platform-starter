import { Suspense } from 'react';
import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { DashboardShell } from '@/components/admin/dashboard/DashboardShell';
import { BuiltCoursesPanel } from './BuiltCoursesPanel';
import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Fetches data independently so the admin shell (nav, idle guard) renders
// immediately from the layout while this streams in via Suspense.
async function DashboardContent() {
  const data = await getAdminDashboardData();
  return (
    <>
      <DashboardShell data={data} />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <BuiltCoursesPanel />
      </div>
    </>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
