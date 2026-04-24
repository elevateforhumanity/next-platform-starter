import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Reports | Partner Portal | Elevate For Humanity',
  description: 'View partnership reports and analytics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PartnerReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/partner/reports');

  // Partner role guard — only partner, admin, super_admin, staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['partner', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Resolve partner org from partner_users
  const { data: partnerUser } = await supabase
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = partnerUser?.partner_id;

  // Stats scoped to this partner org
  const now = new Date();
  const year = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3); // 0-indexed

  // Quarter date boundaries for current year
  const quarterBounds = [
    { label: 'Q1', start: new Date(year, 0, 1),  end: new Date(year, 3, 1) },
    { label: 'Q2', start: new Date(year, 3, 1),  end: new Date(year, 6, 1) },
    { label: 'Q3', start: new Date(year, 6, 1),  end: new Date(year, 9, 1) },
    { label: 'Q4', start: new Date(year, 9, 1),  end: new Date(year + 1, 0, 1) },
  ];

  let totalEnrollments = 0;
  let thisQuarterEnrollments = 0;
  let completedEnrollments = 0;
  let recentCompletions: any[] = [];
  let quarterCounts: number[] = [0, 0, 0, 0];

  if (orgId) {
    const [total, completed, recent, ...quarterResults] = await Promise.all([
      supabase.from('partner_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', orgId),
      supabase.from('partner_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', orgId)
        .eq('status', 'completed'),
      supabase.from('partner_enrollments')
        .select('id, completed_at, student_id, program_slug, profiles(full_name)')
        .eq('partner_id', orgId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5),
      // Per-quarter counts
      ...quarterBounds.map(q =>
        supabase.from('partner_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', orgId)
          .gte('created_at', q.start.toISOString())
          .lt('created_at', q.end.toISOString())
      ),
    ]);

    totalEnrollments = total.count || 0;
    completedEnrollments = completed.count || 0;
    quarterCounts = quarterResults.map((r: any) => r.count || 0);
    thisQuarterEnrollments = quarterCounts[currentQuarter];

    recentCompletions = (recent.data || []).map((r: any) => ({
      ...r,
      student_name: r.profiles?.full_name || 'Unknown',
    }));
  }


  return (
    <div>
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden rounded-xl mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <Image src="/images/pages/partner-page-12.jpg" alt="Partner reports" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Partner', href: '/partner/attendance' }, { label: 'Reports' }]} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Partnership Reports</h1>
            <p className="text-slate-700">Performance metrics and analytics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalEnrollments}</p>
            <p className="text-slate-700 text-sm">Total Enrollments</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-brand-green-500 mb-2" />
            <p className="text-2xl font-bold">{thisQuarterEnrollments}</p>
            <p className="text-slate-700 text-sm">This Quarter</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Calendar className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{completedEnrollments}</p>
            <p className="text-slate-700 text-sm">Completions</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quarterly Performance */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-blue-600" /> Quarterly Performance
            </h2>
            <div className="space-y-4">
              {quarterBounds.map((q, idx) => {
                const value = quarterCounts[idx];
                const maxQ = Math.max(...quarterCounts, 1);
                const pct = Math.round((value / maxQ) * 100);
                const isCurrent = idx === currentQuarter;
                return (
                  <div key={q.label} className="flex items-center gap-4">
                    <span className={`w-8 text-sm font-medium ${isCurrent ? 'text-brand-blue-600' : 'text-slate-700'}`}>
                      {q.label}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isCurrent ? 'bg-brand-blue-500' : 'bg-brand-blue-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-700 w-8 text-right">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Completions */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Recent Completions</h2>
            {recentCompletions.length > 0 ? (
              <div className="space-y-3">
                {recentCompletions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{c.student_name}</p>
                      <p className="text-xs text-slate-700 capitalize">{c.program_slug?.replace(/-/g, ' ') || '—'}</p>
                    </div>
                    <span className="text-xs text-slate-700">
                      {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-700 text-center py-8 text-sm">No completions yet</p>
            )}
          </div>
        </div>

        {/* Report Downloads */}
        <div className="mt-6 bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Available Reports</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Enrollment Summary', desc: 'All apprentice enrollments', period: 'Year to Date' },
              { name: 'Completion Report', desc: 'Completed apprenticeships', period: 'Last 12 Months' },
              { name: 'Hours Summary', desc: 'Training hours logged', period: 'Current Quarter' },
            ].map(report => (
              <div key={report.name} className="border rounded-lg p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <FileText className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-slate-700">{report.desc}</p>
                    <p className="text-xs text-slate-700 mt-1">{report.period}</p>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded">
                    <Download className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
