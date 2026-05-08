import { Suspense } from 'react';
import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';

// Cache dashboard data for 60 seconds — 31 DB queries on every request is too expensive.
// Admins see data that is at most 1 minute stale. Individual action pages (applications,
// enrollments) remain force-dynamic and always show live data.
export const revalidate = 60;
import { BuiltCoursesPanel } from './BuiltCoursesPanel';
import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Fetches data independently so the admin shell (nav, idle guard) renders
// immediately from the layout while this streams in via Suspense.
async function DashboardContent() {
  const data = await getAdminDashboardData();
  return (
    <>
      <AdminDashboardContent data={data} />
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
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
