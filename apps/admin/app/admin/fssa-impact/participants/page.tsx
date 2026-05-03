import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Participants | FSSA SNAP E&T | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  exited:    'bg-slate-100 text-slate-600',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function FssaParticipantsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();
  if (!db) notFound();

  const { data, count } = await db
    .from('fssa_participants')
    .select(
      'id, first_name, last_name, county, case_number, snap_eligible, abawd, enrollment_status, snap_et_enrolled_at, employed_at_exit, hourly_wage, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .limit(200);

  const participants = data ?? [];
  const total = count ?? 0;

  const statusCounts = {
    active:    participants.filter(p => p.enrollment_status === 'active').length,
    pending:   participants.filter(p => p.enrollment_status === 'pending').length,
    completed: participants.filter(p => p.enrollment_status === 'completed').length,
    exited:    participants.filter(p => p.enrollment_status === 'exited').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
              { label: 'Participants' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/fssa-impact" className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Participants</h1>
              <p className="text-sm text-slate-500">{total} total enrolled in SNAP E&T</p>
            </div>
          </div>
          <Link
            href="/admin/fssa-impact/intake"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            New Intake
          </Link>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(statusCounts).map(([status, n]) => (
            <div key={status} className="bg-white rounded-xl border shadow-sm px-4 py-3">
              <p className="text-xs text-slate-500 capitalize mb-1">{status}</p>
              <p className="text-2xl font-bold text-slate-900">{n}</p>
            </div>
          ))}
        </div>

        {/* Participant table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {participants.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm mb-4">No participants yet.</p>
              <Link
                href="/admin/fssa-impact/intake"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                Add First Participant
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">County</th>
                    <th className="px-4 py-3">Case #</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Enrolled</th>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {p.last_name}, {p.first_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.county ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.case_number ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.snap_eligible && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">SNAP</span>
                          )}
                          {p.abawd && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">ABAWD</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[p.enrollment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {p.enrollment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(p.snap_et_enrolled_at)}</td>
                      <td className="px-4 py-3 text-xs">
                        {p.employed_at_exit === true ? (
                          <span className="text-emerald-600 font-medium">
                            Employed {p.hourly_wage ? `@ $${p.hourly_wage}/hr` : ''}
                          </span>
                        ) : p.employed_at_exit === false ? (
                          <span className="text-slate-400">Not employed at exit</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/fssa-impact/participants/${p.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          View →
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
