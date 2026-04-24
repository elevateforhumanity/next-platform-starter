import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Building2, Users, Briefcase, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Employers Playbook | Admin',
};

export default async function EmployersPlaybookPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  const [
    { data: employers, count: totalEmployers },
    { count: activeEmployers },
    { data: jobPostings, count: totalJobs },
    { count: activeJobs },
  ] = await Promise.all([
    db
      .from('partner_organizations')
      .select('id, name, type, status, city, state, created_at', { count: 'exact' })
      .order('name')
      .limit(100),
    db.from('partner_organizations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db
      .from('job_postings')
      .select('id, title, status, created_at, partner_organizations!job_postings_employer_id_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Employers Playbook' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employers Playbook</h1>
            <p className="text-slate-600 text-sm mt-1">Employer partnerships and job posting management</p>
          </div>
          <Link href="/admin/partners" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
            Manage Partners
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Employers', value: totalEmployers ?? 0, icon: Building2, color: 'text-slate-900' },
            { label: 'Active Partners', value: activeEmployers ?? 0, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Total Jobs', value: totalJobs ?? 0, icon: Briefcase, color: 'text-brand-blue-600' },
            { label: 'Active Listings', value: activeJobs ?? 0, icon: Users, color: 'text-green-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-slate-600">{label}</span>
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Partner Organizations</h2>
              <span className="text-xs text-slate-500">{totalEmployers ?? 0} total</span>
            </div>
            {employers && employers.length > 0 ? (
              <div className="divide-y">
                {employers.map((e: any) => (
                  <div key={e.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500">{[e.city, e.state].filter(Boolean).join(', ') || e.type || '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{e.status ?? 'unknown'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">No partner organizations found.</div>
            )}
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Job Postings</h2>
              <Link href="/admin/jobs" className="text-xs text-brand-blue-600 hover:underline">View all →</Link>
            </div>
            {jobPostings && jobPostings.length > 0 ? (
              <div className="divide-y">
                {jobPostings.map((j: any) => {
                  const org = j.partner_organizations as any;
                  return (
                    <div key={j.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500">{org?.name ?? '—'} · {new Date(j.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        j.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{j.status}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">No job postings found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
