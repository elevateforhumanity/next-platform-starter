import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import MissionControlClient from './MissionControlClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Mission Control | Admin | Elevate for Humanity',
  description: 'Centralized operational dashboard — system health, deployments, AI status, enrollments, and alerts.',
  robots: { index: false, follow: false },
};

async function getMissionData() {
  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [
    profilesRes,
    enrollmentsRes,
    pendingAppsRes,
    recentEnrollmentsRes,
    auditLogsRes,
    snapshotsRes,
    deliveryLogsRes,
    failedDeliveryRes,
    certificatesRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    db.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    db.from('program_enrollments')
      .select('id, created_at, user_id')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('audit_logs')
      .select('id, action, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('platform_snapshots')
      .select('id, snapshot_type, label, rolled_back, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('delivery_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo)
      .eq('status', 'sent'),
    db.from('delivery_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo)
      .eq('status', 'failed'),
    db.from('program_completion_certificates')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo),
  ]);

  return {
    // Health
    dbConnected: !profilesRes.error,
    totalUsers: profilesRes.count ?? 0,
    totalEnrollments: enrollmentsRes.count ?? 0,
    pendingApplications: pendingAppsRes.count ?? 0,
    // Activity
    enrollmentsToday: recentEnrollmentsRes.data?.length ?? 0,
    emailsSentToday: deliveryLogsRes.count ?? 0,
    emailsFailedToday: failedDeliveryRes.count ?? 0,
    certificatesThisWeek: certificatesRes.count ?? 0,
    // Recent data
    recentAuditLogs: auditLogsRes.data ?? [],
    recentSnapshots: snapshotsRes.data ?? [],
  };
}

export default async function MissionControlPage() {
  await requireAdmin();
  const data = await getMissionData();
  return <MissionControlClient data={data} />;
}
