import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SystemStatusPanel } from '@/components/admin/SystemStatusPanel';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/system-health' },
  title: 'System Health | Admin | Elevate for Humanity',
  description: 'Monitor system health, API status, and integration connectivity.',
};

async function getHealthData() {
  const adminClient = await getAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const [profilesRes, enrollmentsRes, applicationsRes, auditRes] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    db.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    db.from('audit_logs').select('id, created_at').order('created_at', { ascending: false }).limit(1),
  ]);

  return {
    profileCount: profilesRes.count ?? 0,
    enrollmentCount: enrollmentsRes.count ?? 0,
    pendingApplications: applicationsRes.count ?? 0,
    lastAuditEntry: auditRes.data?.[0]?.created_at ?? null,
    dbConnected: !profilesRes.error,
  };
}

export default async function SystemHealthPage() {
  await requireRole(['admin', 'super_admin']);
  const health = await getHealthData();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'System Health' }]} />
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
          <p className="text-slate-600 mt-1">Platform status, DB connectivity, and governance posture.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Database</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-slate-900">{health.profileCount.toLocaleString()}</p>
                  <p className="text-sm text-slate-600 mt-1">Total Users</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-slate-900">{health.enrollmentCount.toLocaleString()}</p>
                  <p className="text-sm text-slate-600 mt-1">Enrollments</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-slate-900">{health.pendingApplications.toLocaleString()}</p>
                  <p className="text-sm text-slate-600 mt-1">Pending Applications</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health.dbConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-700">
                  {health.dbConnected ? 'Supabase connected' : 'Supabase unreachable — check SUPABASE_SERVICE_ROLE_KEY'}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Diagnostics</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/api/health" target="_blank"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                  /api/health
                </Link>
                <Link href="/api/admin/monitoring/status" target="_blank"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                  Monitoring Status
                </Link>
                <Link href="/admin/monitoring"
                  className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
                  Full Monitor Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div>
            <SystemStatusPanel
              lastComplianceReview={health.lastAuditEntry ?? undefined}
              environment="Production"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
