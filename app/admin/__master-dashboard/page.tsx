import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { Users, GraduationCap, Briefcase, DollarSign, FileText, Award, TrendingUp, Building2, ChevronRight, ArrowRight, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Master Dashboard | Admin | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function MasterDashboardPage() {
  await requireAdmin();
  const db = await getAdminClient();

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalStaff },
    { count: totalEmployers },
    { count: activeEnrollments },
    { count: completedEnrollments },
    { count: totalApplications },
    { count: pendingApplications },
    { count: publishedPrograms },
    { count: totalCertificates },
    { count: totalPartners },
    { count: pendingSubmissions },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['staff', 'admin', 'super_admin']),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('applications').select('*', { count: 'exact', head: true }),
    db.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('published', true).eq('is_active', true),
    db.from('program_completion_certificates').select('*', { count: 'exact', head: true }),
    db.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('step_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Recent applications
  const { data: recentApps } = await db
    .from('applications')
    .select('id, status, created_at, program_id, programs(title)')
    .order('created_at', { ascending: false })
    .limit(6);

  // Recent new users
  const { data: recentUsers } = await db
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(6);

  const completionRate = (activeEnrollments ?? 0) + (completedEnrollments ?? 0) > 0
    ? Math.round(((completedEnrollments ?? 0) / ((activeEnrollments ?? 0) + (completedEnrollments ?? 0))) * 100)
    : 0;

  const STATS = [
    { label: 'Total Users', value: totalUsers ?? 0, sub: `${totalStudents ?? 0} students · ${totalStaff ?? 0} staff`, icon: Users, color: 'text-blue-500', href: '/admin/users' },
    { label: 'Active Enrollments', value: activeEnrollments ?? 0, sub: `${completionRate}% completion rate`, icon: GraduationCap, color: 'text-green-500', href: '/admin/enrollments' },
    { label: 'Pending Applications', value: pendingApplications ?? 0, sub: `${totalApplications ?? 0} total`, icon: FileText, color: (pendingApplications ?? 0) > 0 ? 'text-red-500' : 'text-slate-400', href: '/admin/applications' },
    { label: 'Published Programs', value: publishedPrograms ?? 0, sub: 'active training programs', icon: Briefcase, color: 'text-purple-500', href: '/admin/programs' },
    { label: 'Certificates Issued', value: totalCertificates ?? 0, sub: 'program completions', icon: Award, color: 'text-teal-500', href: '/admin/certificates' },
    { label: 'Active Partners', value: totalPartners ?? 0, sub: 'employer & agency partners', icon: Building2, color: 'text-indigo-500', href: '/admin/partners' },
    { label: 'Employers', value: totalEmployers ?? 0, sub: 'registered employer accounts', icon: TrendingUp, color: 'text-amber-500', href: '/admin/employers' },
    { label: 'Pending Reviews', value: pendingSubmissions ?? 0, sub: 'lab & assignment submissions', icon: Activity, color: (pendingSubmissions ?? 0) > 0 ? 'text-red-500' : 'text-slate-400', href: '/admin/submissions' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">Admin</p>
          <h1 className="text-xl font-bold text-slate-900">Master Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Full platform overview — all systems</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/lms-dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">LMS</Link>
          <Link href="/admin/dashboard-enhanced" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Curriculum</Link>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Main <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} href={s.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{s.value.toLocaleString()}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Recent Applications</h2>
              <Link href="/admin/applications" className="text-sm text-brand-red-600 hover:underline">View all</Link>
            </div>
            {!recentApps?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No applications yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentApps.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.programs?.title ?? 'Program'}</p>
                      <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      a.status === 'approved' ? 'bg-green-50 text-green-700' :
                      a.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      a.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">New Users</h2>
              <Link href="/admin/users" className="text-sm text-brand-red-600 hover:underline">View all</Link>
            </div>
            {!recentUsers?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No users yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.full_name ?? 'User'}</p>
                      <p className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: 'Users', href: '/admin/users' },
            { label: 'Enrollments', href: '/admin/enrollments' },
            { label: 'Applications', href: '/admin/applications' },
            { label: 'Programs', href: '/admin/programs' },
            { label: 'Partners', href: '/admin/partners' },
            { label: 'Analytics', href: '/admin/analytics' },
            { label: 'Portal Map', href: '/admin/portal-map' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {l.label} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
