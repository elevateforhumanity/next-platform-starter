import { Suspense } from 'react';
import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import type { AdminDashboardData } from '@/components/admin/dashboard/types';
import { logger } from '@/lib/logger';
import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // cache dashboard data for 60s — reduces DB load

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Auth and role enforcement is handled by apps/admin/app/admin/layout.tsx.
// No redundant requireAdmin() here — it added 3 extra DB round-trips per load
// and threw ERR_DASHBOARD_LOAD when NEXT_PUBLIC_ADMIN_URL was missing.
function getDegradedDashboardData(): AdminDashboardData {
  return {
    counts: {
      pendingApplications: 0,
      activeEnrollments: 0,
      revenueThisMonthCents: 0,
      certificatesIssued: 0,
      pendingProgramHolders: 0,
      pendingDocuments: 0,
    },
    revenueAllTimeCents: 0,
    totalStudents: 0,
    recentPayments: [],
    operational: {
      needsReview: 0,
      needsReviewDetail: 'Dashboard data is temporarily unavailable',
      atRisk: 0,
      complianceAlerts: 0,
      complianceAlertsSeverity: null,
      newToday: 0,
      newTodayDetail: 'Dashboard data is temporarily unavailable',
      newAppsToday: 0,
      newLeadsToday: 0,
      newEnrollmentsToday: 0,
      revenueThisMonthCents: 0,
    },
    priorities: [],
    kpis: [],
    enrollmentTrend: [],
    studentStatuses: [],
    topPrograms: [],
    recentActivity: [],
    recentStudents: [],
    recentApplications: [],
    blockedPrograms: [],
    inactiveLearners: [],
    pendingSubmissions: [],
    complianceAlerts: [],
    staleLeads: [],
    pendingWioaDocs: 0,
    stalledApplications: [],
    noOutcomeEnrollments: [],
    missingFundingEnrollments: [],
    profile: null,
    generatedAt: new Date().toISOString(),
    sitePreviewTargets: [
      {
        label: 'Public Site',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      },
      {
        label: 'Admin',
        url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
      },
      {
        label: 'LMS',
        url:
          process.env.NEXT_PUBLIC_LMS_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/lms`,
      },
    ],
    degradedSections: ['dashboard_data'],
    systemHealth: {
      stripeWebhookOk: false,
      stripeIssuingOk: false,
      buildEnvOk: false,
      staleJobs: 0,
      degraded: true,
      missingDocuments: 0,
      missingCertifications: 0,
      unresolvedFlags: 0,
      alerts: [
        {
          code: 'dashboard_data_unavailable',
          severity: 'warning',
          message: 'Dashboard metrics failed to load. Navigation and admin tools remain available.',
        },
      ],
    },
  };
}

async function DashboardContent() {
  let data;
  try {
    data = await getAdminDashboardData();
  } catch (err) {
    logger.error('[AdminDashboardPage] Dashboard data load failed; rendering degraded dashboard', err);
    data = getDegradedDashboardData();
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
