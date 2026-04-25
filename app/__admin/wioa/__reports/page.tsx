import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { BarChart3, Download, TrendingUp, Users, DollarSign, ArrowLeft, FileText, Clock, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WIOA Reports | Admin',
  description: 'Generate and view WIOA performance reports.',
  robots: { index: false, follow: false },
};

// Fixed report type definitions — these are a UI enum, not user data.
// "Last generated" is populated from wioa_report_runs in the DB.
const REPORT_TYPES = [
  { id: 'quarterly',   name: 'Quarterly Performance Report', description: 'WIOA performance metrics for state reporting' },
  { id: 'enrollment',  name: 'Enrollment Summary',           description: 'Participant enrollment and demographics' },
  { id: 'outcomes',    name: 'Outcome Tracking Report',      description: 'Employment and credential outcomes' },
  { id: 'expenditure', name: 'Expenditure Report',           description: 'Training and support service costs' },
  { id: 'compliance',  name: 'Compliance Audit Report',      description: 'Documentation and eligibility compliance' },
];

interface ReportRun {
  id: string;
  report_type: string;
  generated_at: string;
  generated_by: string | null;
  period: string | null;
  file_url: string | null;
  status: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function WIOAReportsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();
  const db = await getAdminClient();

  const [
    { count: totalParticipants },
    { count: completedEnrollments },
    { count: totalCerts },
    { data: employmentData },
    { data: reportRuns },
  ] = await Promise.all([
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('employment_outcomes').select('wage_at_placement').not('wage_at_placement', 'is', null).limit(500),
    // Gracefully empty if wioa_report_runs doesn't exist yet
    db.from('wioa_report_runs')
      .select('id, report_type, generated_at, generated_by, period, file_url, status')
      .order('generated_at', { ascending: false })
      .limit(50),
  ]);

  const credentialRate = (totalParticipants && totalParticipants > 0)
    ? Math.round(((totalCerts || 0) / totalParticipants) * 100)
    : 0;

  const wages = (employmentData ?? []).map((r: any) => Number(r.wage_at_placement)).filter(w => w > 0);
  const avgWage = wages.length > 0
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
        .format(wages.reduce((a, b) => a + b, 0) / wages.length)
    : 'N/A';

  // Most recent run per report type
  const latestRunByType = new Map<string, ReportRun>();
  for (const run of (reportRuns ?? []) as ReportRun[]) {
    if (!latestRunByType.has(run.report_type)) latestRunByType.set(run.report_type, run);
  }

  const metrics = [
    { label: 'Total Participants', value: String(totalParticipants || 0), icon: Users },
    { label: 'Completed',          value: String(completedEnrollments || 0), icon: TrendingUp },
    { label: 'Avg. Wage at Exit',  value: avgWage, icon: DollarSign },
    { label: 'Credential Rate',    value: `${credentialRate}%`, icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'WIOA', href: '/admin/wioa' },
          { label: 'Reports' },
        ]} />
      </div>

      <div className="max-w-6xl mx-auto">
        <Link href="/admin/wioa" className="flex items-center gap-2 text-slate-700 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to WIOA Management
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">WIOA Reports</h1>
          <p className="text-slate-700">Performance and compliance reports — live data from database</p>
        </div>

        {/* Live metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-white rounded-xl shadow-sm border p-6">
              <metric.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
              <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
              <p className="text-sm text-slate-700">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Available reports — last generated pulled from DB */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-slate-900">Available Reports</h2>
          </div>
          <div className="divide-y">
            {REPORT_TYPES.map((report) => {
              const lastRun = latestRunByType.get(report.id);
              return (
                <div key={report.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{report.name}</h3>
                      <p className="text-sm text-slate-700">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-700">Last generated</p>
                      <p className="text-sm font-medium text-slate-900">
                        {lastRun ? fmtDate(lastRun.generated_at) : 'Not yet generated'}
                      </p>
                      {lastRun?.period && <p className="text-xs text-slate-700">{lastRun.period}</p>}
                    </div>
                    {lastRun?.file_url ? (
                      <a
                        href={lastRun.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    ) : (
                      <span className="px-4 py-2 border rounded-lg text-sm text-slate-400 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Not generated
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report run history — only shown when records exist */}
        {(reportRuns ?? []).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-slate-900">Report Run History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Report Type', 'Period', 'Generated', 'Generated By', 'Status', 'File'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(reportRuns as ReportRun[]).map(run => (
                    <tr key={run.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {REPORT_TYPES.find(r => r.id === run.report_type)?.name ?? run.report_type}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{run.period ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(run.generated_at)}</td>
                      <td className="px-4 py-3 text-slate-600">{run.generated_by ?? 'system'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          run.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {run.status === 'complete' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {run.file_url
                          ? <a href={run.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Download</a>
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
