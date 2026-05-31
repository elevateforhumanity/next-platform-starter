import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { ComplianceBar } from '@/components/ComplianceBar';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Metrics',
  description: `Live enrollment, completion, and certification metrics for ${PLATFORM_DEFAULTS.orgName} workforce training programs.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/metrics',
  },
};

export const revalidate = 300;

export default async function MetricsPage() {
  const supabase = await getAdminClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const [
    enrolledRes,
    completedRes,
    certsRes,
    pccRes,
    employerRes,
    employerPartnersRes,
    programsRes,
    studentsRes,
    jobsRes,
  ] = await Promise.all([
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employer'),
    supabase.from('employer_partners').select('id', { count: 'exact', head: true }),
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .neq('status', 'archived'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const totalEnrolled = enrolledRes.count ?? 0;
  const totalCompleted = completedRes.count ?? 0;
  const totalCerts = (certsRes.count ?? 0) + (pccRes.count ?? 0);
  const totalEmployers = Math.max(employerRes.count ?? 0, employerPartnersRes.count ?? 0);
  const totalPrograms = programsRes.count ?? 0;
  const totalStudents = studentsRes.count ?? 0;
  const activeJobs = jobsRes.count ?? 0;

  const cards = [
    { label: 'Program enrollments', value: totalEnrolled, note: 'program_enrollments' },
    { label: 'Completed enrollments', value: totalCompleted, note: 'status = completed' },
    { label: 'Student profiles', value: totalStudents, note: 'profiles.role = student' },
    { label: 'Credentials issued', value: totalCerts, note: 'certificates + PCC' },
    { label: 'Published programs', value: totalPrograms, note: 'programs.published' },
    { label: 'Employer accounts', value: totalEmployers, note: 'profiles + employer_partners' },
    { label: 'Active job postings', value: activeJobs, note: 'job_postings.status = active' },
  ];

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Metrics' }]} />
      </div>
      <ComplianceBar />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4 text-black">Impact Metrics</h1>
        <p className="text-lg text-black mb-4">
          Live counts from Supabase — refreshed every five minutes. See also{' '}
          <a href="/outcomes" className="text-brand-blue-600 underline font-medium">
            outcomes reporting
          </a>
          .
        </p>
        <p className="text-sm text-slate-500 mb-12">
          Run <code className="text-xs bg-slate-100 px-1 rounded">node scripts/ops/live-platform-counts.mjs</code>{' '}
          locally for the full audit table.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center"
            >
              <div className="text-5xl font-bold text-brand-blue-600 mb-2">
                {c.value > 0 ? c.value.toLocaleString() : '—'}
              </div>
              <div className="text-lg text-black font-medium">{c.label}</div>
              <div className="text-xs text-slate-500 mt-2">{c.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
