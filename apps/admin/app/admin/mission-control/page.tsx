import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import MissionControlClient from './MissionControlClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Mission Control | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function MissionControlPage() {
  await requireAdmin();
  const db = await requireAdminClient();

  const [
    { count: students },
    { count: activeEnrollments },
    { count: completedEnrollments },
    { count: pendingApplications },
    { count: openAtRisk },
    { count: publishedPrograms },
    { count: activeCourses },
    { count: pendingDocuments },
    { count: activeWioa },
    { count: activeGrants },
    { count: activeContracts },
    { count: jobPlacements },
    revenueResult,
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('at_risk_students').select('*', { count: 'exact', head: true }).eq('resolved', false),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('published', true).eq('is_active', true),
    db.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    db.from('wioa_participants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('grants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('job_placements').select('*', { count: 'exact', head: true }),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
  ]);

  // Sum revenue from paid enrollments
  const revenueCents = (revenueResult.data ?? []).reduce(
    (sum: number, r: { amount_paid_cents: number | null }) => sum + (r.amount_paid_cents ?? 0),
    0,
  );

  const snapshot = {
    students: students ?? 0,
    activeEnrollments: activeEnrollments ?? 0,
    completedEnrollments: completedEnrollments ?? 0,
    pendingApplications: pendingApplications ?? 0,
    openAtRisk: openAtRisk ?? 0,
    publishedPrograms: publishedPrograms ?? 0,
    activeCourses: activeCourses ?? 0,
    pendingDocuments: pendingDocuments ?? 0,
    activeWioa: activeWioa ?? 0,
    activeGrants: activeGrants ?? 0,
    activeContracts: activeContracts ?? 0,
    jobPlacements: jobPlacements ?? 0,
    revenueCents,
    fetchedAt: new Date().toISOString(),
  };

  return <MissionControlClient snapshot={snapshot} />;
}
