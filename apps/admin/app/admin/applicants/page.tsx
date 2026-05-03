import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { Users, Eye, Download, Search } from 'lucide-react';
import { ApplicantActions } from './ApplicantActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Applicants | Admin',
  description: 'Review, approve, and manage program applicants.',
};

const STATUS_STYLES: Record<string, string> = {
  submitted:    'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved:     'bg-green-100 text-green-800',
  denied:       'bg-red-100 text-red-800',
  withdrawn:    'bg-slate-100 text-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  approved:     'Approved',
  denied:       'Denied',
  withdrawn:    'Withdrawn',
};

export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();
  const db = await requireAdminClient();
  if (!db) throw new Error('Admin client unavailable');

  const { status: filterStatus, q: search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let query = db
    .from('applications')
    .select(
      'id, first_name, last_name, email, phone, program_interest, status, reference_number, created_at, source',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filterStatus && filterStatus !== 'all') query = query.eq('status', filterStatus);
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,reference_number.ilike.%${search}%`,
    );
  }

  const { data: applications, count } = await query;

  const statusCounts = await Promise.all(
    ['submitted', 'under_review', 'approved', 'denied'].map(async (s) => {
      const { count: c } = await db
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', s);
      return { status: s, count: c ?? 0 };
    }),
  );

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Applicants' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Applicants</h1>
            <p className="text-slate-500 text-sm mt-0.5">{count ?? 0} total applications</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/admin/applicants/export"
              className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </a>
            <Link
              href="/admin/intake"
              className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition"
            >
              + New Intake
            </Link>
          </div>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {statusCounts.map(({ status, count: c }) => (
            <Link
              key={status}
              href={`/admin/applicants?status=${status}`}
              className={`bg-white rounded-xl border p-4 hover:shadow-sm transition ${filterStatus === status ? 'border-brand-blue-500 ring-1 ring-brand-blue-500' : 'border-slate-200'}`}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                {STATUS_LABELS[status]}
              </p>
              <p className="text-2xl font-extrabold text-slate-900">{c}</p>
            </Link>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <form method="GET" className="flex gap-2 flex-1 min-w-[200px]">
            {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="q"
                defaultValue={search}
                placeholder="Search name, email, reference #..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <button type="submit" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 transition">
              Search
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {['all', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn'].map((s) => (
              <Link
                key={s}
                href={s === 'all' ? '/admin/applicants' : `/admin/applicants?status=${s}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  (s === 'all' && !filterStatus) || filterStatus === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {STATUS_LABELS[s] ?? 'All'}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!applications || applications.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No applicants found</p>
              {(search || filterStatus) && (
                <Link href="/admin/applicants" className="text-sm text-brand-blue-600 underline mt-2 inline-block">
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Applicant</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Program</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Ref #</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Applied</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{app.first_name} {app.last_name}</p>
                      <p className="text-slate-500 text-xs">{app.email}</p>
                      {app.phone && <p className="text-slate-400 text-xs">{app.phone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-slate-700 text-xs">{app.program_interest ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-500">{app.reference_number ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[app.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-500 text-xs">
                      {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/applications/${app.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:underline">
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Link>
                        <ApplicantActions
                          applicationId={app.id}
                          currentStatus={app.status}
                          applicantName={`${app.first_name} ${app.last_name}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">Page {page} of {totalPages} · {count} total</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/applicants?page=${page - 1}${filterStatus ? `&status=${filterStatus}` : ''}${search ? `&q=${search}` : ''}`} className="text-sm font-semibold px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/applicants?page=${page + 1}${filterStatus ? `&status=${filterStatus}` : ''}${search ? `&q=${search}` : ''}`} className="text-sm font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
