import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import AttendanceForm from '@/components/admin/fssa/AttendanceForm';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Attendance | FSSA SNAP E&T | Admin',
};

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default async function FssaAttendancePage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();
  if (!db) notFound();

  // Recent attendance with participant names
  const { data: recent } = await db
    .from('fssa_attendance')
    .select('id, session_date, session_type, hours_attended, present, excused, participant_id')
    .order('session_date', { ascending: false })
    .limit(50);

  // Active participants for the form dropdown
  const { data: participants } = await db
    .from('fssa_participants')
    .select('id, first_name, last_name, abawd')
    .eq('enrollment_status', 'active')
    .order('last_name');

  const rows = recent ?? [];
  const activeParticipants = participants ?? [];

  // Weekly hours per participant (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weeklyMap: Record<string, number> = {};
  for (const r of rows) {
    if (r.present && r.session_date >= oneWeekAgo) {
      weeklyMap[r.participant_id] = (weeklyMap[r.participant_id] ?? 0) + (r.hours_attended ?? 0);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
              { label: 'Attendance' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/fssa-impact" className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
            <p className="text-sm text-slate-500">Record and review SNAP E&T participant attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Record attendance */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Record Attendance</h2>
            <AttendanceForm />
          </div>

          {/* ABAWD weekly hours status */}
          {activeParticipants.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                This Week — ABAWD Hours Status
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4">Participant</th>
                      <th className="pb-2 pr-4">Hrs This Week</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeParticipants.map((p) => {
                      const hrs = weeklyMap[p.id] ?? 0;
                      const ok = hrs >= 20;
                      return (
                        <tr key={p.id}>
                          <td className="py-2 pr-4 font-medium text-slate-800">
                            {p.last_name}, {p.first_name}
                            {p.abawd && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ABAWD</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{hrs} hrs</td>
                          <td className="py-2">
                            {p.abawd ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {ok ? '✓ Met' : `⚠ ${20 - hrs} hrs short`}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Recent attendance log */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Recent Attendance Log</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Participant</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Hours</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const p = activeParticipants.find((x) => x.id === r.participant_id);
                    return (
                      <tr key={r.id}>
                        <td className="py-2 pr-4 text-slate-600">{fmtDate(r.session_date)}</td>
                        <td className="py-2 pr-4 font-medium text-slate-800">
                          {p ? `${p.last_name}, ${p.first_name}` : r.participant_id.slice(0, 8) + '…'}
                        </td>
                        <td className="py-2 pr-4 text-slate-500 capitalize">{r.session_type.replace('_', ' ')}</td>
                        <td className="py-2 pr-4 text-slate-600">{r.hours_attended}</td>
                        <td className="py-2">
                          {r.present ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Present</span>
                          ) : r.excused ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Excused</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">Absent</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
