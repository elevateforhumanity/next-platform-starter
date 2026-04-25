import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  pending_review: 'bg-orange-100 text-orange-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-slate-100 text-slate-500',
  withdrawn: 'bg-red-100 text-red-600',
};

export default async function AdminEnrollmentPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = getAdminClient();

  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('id, full_name, email, program_id, status, enrolled_at, amount_paid_cents, funding_source')
    .order('enrolled_at', { ascending: false })
    .limit(100);

  const { data: programs } = await db
    .from('programs')
    .select('id, title');

  const rows = enrollments ?? [];
  const programMap: Record<string, string> = {};
  for (const p of programs ?? []) programMap[p.id] = p.title;

  const activeCount = rows.filter((e) => e.status === 'active').length;
  const pendingCount = rows.filter((e) => e.status?.includes('pending')).length;
  const completedCount = rows.filter((e) => e.status === 'completed').length;
  const totalRevenue = rows.reduce((sum, e) => sum + (e.amount_paid_cents ?? 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enrollment</h1>
            <p className="text-slate-500 text-sm mt-0.5">{rows.length} total enrollments</p>
          </div>
          <Link
            href="/admin/enrollments"
            className="text-sm text-blue-600 hover:underline"
          >
            Full enrollment manager →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-yellow-600' },
            { label: 'Completed', value: completedCount, icon: TrendingUp, color: 'text-blue-600' },
            { label: 'Revenue', value: `$${(totalRevenue / 100).toLocaleString()}`, icon: AlertTriangle, color: 'text-slate-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No enrollments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Student</th>
                    <th className="px-6 py-3 text-left">Program</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Funding</th>
                    <th className="px-6 py-3 text-right">Amount Paid</th>
                    <th className="px-6 py-3 text-left">Enrolled</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{e.full_name ?? '—'}</div>
                        <div className="text-xs text-slate-400">{e.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {e.program_id ? (programMap[e.program_id] ?? e.program_id.slice(0, 8) + '…') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{e.funding_source ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        ${((e.amount_paid_cents ?? 0) / 100).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(e.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/enrollments/${e.id}`} className="text-blue-600 hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
