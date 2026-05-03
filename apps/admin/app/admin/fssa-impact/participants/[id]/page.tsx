import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';
import ParticipantExitForm from './ParticipantExitForm';
import ProgramComponentForm from '@/components/admin/fssa/ProgramComponentForms';
import AttendanceForm from '@/components/admin/fssa/AttendanceForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: 'Participant Case File | FSSA SNAP E&T | Admin',
  };
}

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  exited:    'bg-slate-100 text-slate-600',
};

const COMPONENT_STATUS_STYLES: Record<string, string> = {
  active:     'bg-emerald-100 text-emerald-700',
  pending:    'bg-amber-100 text-amber-700',
  completed:  'bg-blue-100 text-blue-700',
  exempted:   'bg-slate-100 text-slate-500',
  sanctioned: 'bg-rose-100 text-rose-700',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default async function ParticipantDetailPage({ params }: { params: { id: string } }) {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();
  const { id } = params;

  const [participantRes, attendanceRes, componentsRes] = await Promise.all([
    db
      .from('fssa_participants')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    db
      .from('fssa_attendance')
      .select('id, session_date, session_type, hours_attended, present, excused, notes')
      .eq('participant_id', id)
      .order('session_date', { ascending: false })
      .limit(100),
    db
      .from('fssa_program_components')
      .select('id, component_type, start_date, end_date, required_hours, completed_hours, status, provider_name, notes')
      .eq('participant_id', id)
      .order('start_date', { ascending: false }),
  ]);

  const p = participantRes.data;
  if (!p) notFound();

  const attendance = attendanceRes.data ?? [];
  const components = componentsRes.data ?? [];

  const totalHours = attendance.filter(a => a.present).reduce((s, a) => s + (a.hours_attended ?? 0), 0);

  // Weekly hours (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weeklyHours = attendance
    .filter(a => a.present && a.session_date >= oneWeekAgo)
    .reduce((s, a) => s + (a.hours_attended ?? 0), 0);

  const fullName = `${p.first_name} ${p.last_name}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
              { label: 'Participants', href: '/admin/fssa-impact/participants' },
              { label: fullName },
            ]}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/admin/fssa-impact/participants" className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[p.enrollment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                {p.enrollment_status}
              </span>
              {p.abawd && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">ABAWD</span>}
              {p.snap_eligible && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">SNAP Eligible</span>}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Case #{p.case_number ?? 'Not assigned'} · {p.county ?? '—'} County · Enrolled {fmtDate(p.snap_et_enrolled_at)}
            </p>
          </div>
        </div>

        {/* ABAWD hours alert */}
        {p.abawd && p.enrollment_status === 'active' && weeklyHours < 20 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
            <p className="text-sm font-semibold text-rose-800">
              ⚠ ABAWD hours deficit — {weeklyHours} hrs logged this week (minimum 20 required)
            </p>
            <p className="text-xs text-rose-600 mt-1">
              Participant risks losing SNAP eligibility. Record attendance or document an exemption.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Intake info */}
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Intake Information</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: 'Date of Birth', value: fmtDate(p.date_of_birth) },
                  { label: 'SSN Last 4', value: p.ssn_last4 ? `***-**-${p.ssn_last4}` : '—' },
                  { label: 'Phone', value: p.phone ?? '—' },
                  { label: 'Email', value: p.email ?? '—' },
                  { label: 'County', value: p.county ?? '—' },
                  { label: 'FSSA Case #', value: p.case_number ?? '—' },
                  { label: 'Orientation', value: p.orientation_completed ? 'Completed' : 'Pending' },
                  { label: 'Intake Date', value: fmtDateTime(p.intake_completed_at) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              {p.barriers && Array.isArray(p.barriers) && p.barriers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Barriers to Employment</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.barriers as string[]).map((b) => (
                      <span key={b} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs capitalize">
                        {b.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {p.case_notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Case Notes</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.case_notes}</p>
                </div>
              )}
            </section>

            {/* Program components */}
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Program Components</h2>
              {components.length === 0 ? (
                <p className="text-sm text-slate-400 mb-4">No components assigned yet.</p>
              ) : (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                        <th className="pb-2 pr-4">Component</th>
                        <th className="pb-2 pr-4">Provider</th>
                        <th className="pb-2 pr-4">Dates</th>
                        <th className="pb-2 pr-4">Hours</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {components.map((c) => {
                        const pct = c.required_hours ? Math.min(100, Math.round(((c.completed_hours ?? 0) / c.required_hours) * 100)) : null;
                        return (
                          <tr key={c.id}>
                            <td className="py-2 pr-4 font-medium text-slate-800 capitalize">
                              {c.component_type.replace(/_/g, ' ')}
                            </td>
                            <td className="py-2 pr-4 text-slate-500">{c.provider_name ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-500 text-xs">
                              {fmtDate(c.start_date)}{c.end_date ? ` – ${fmtDate(c.end_date)}` : ''}
                            </td>
                            <td className="py-2 pr-4 text-slate-600">
                              {c.completed_hours ?? 0}{c.required_hours ? ` / ${c.required_hours}` : ''} hrs
                              {pct !== null && (
                                <div className="w-20 h-1 bg-slate-100 rounded-full mt-1">
                                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                              )}
                            </td>
                            <td className="py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${COMPONENT_STATUS_STYLES[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <details className="group">
                <summary className="text-xs font-medium text-blue-600 cursor-pointer hover:underline list-none">
                  + Assign New Component
                </summary>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <ProgramComponentForm participantId={p.id} participantName={fullName} />
                </div>
              </details>
            </section>

            {/* Attendance log */}
            <section className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">Attendance Log</h2>
                <div className="text-right text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{totalHours} hrs</span> total ·{' '}
                  <span className={weeklyHours >= 20 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    {weeklyHours} hrs this week
                  </span>
                </div>
              </div>

              {attendance.length === 0 ? (
                <p className="text-sm text-slate-400 mb-4">No attendance recorded yet.</p>
              ) : (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4">Hours</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2 pr-4 text-slate-600">{fmtDate(a.session_date)}</td>
                          <td className="py-2 pr-4 text-slate-500 capitalize">{a.session_type.replace(/_/g, ' ')}</td>
                          <td className="py-2 pr-4 text-slate-700 font-medium">{a.hours_attended}</td>
                          <td className="py-2 pr-4">
                            {a.present ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Present</span>
                            ) : a.excused ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Excused</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">Absent</span>
                            )}
                          </td>
                          <td className="py-2 text-slate-400 text-xs">{a.notes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <details className="group">
                <summary className="text-xs font-medium text-blue-600 cursor-pointer hover:underline list-none">
                  + Record Attendance
                </summary>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <AttendanceForm participantId={p.id} participantName={fullName} />
                </div>
              </details>
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Hours summary */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Hours Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total hours</span>
                  <span className="font-bold text-slate-900">{totalHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">This week</span>
                  <span className={`font-bold ${weeklyHours >= 20 ? 'text-emerald-600' : 'text-rose-600'}`}>{weeklyHours}</span>
                </div>
                {p.abawd && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ABAWD minimum</span>
                    <span className="font-medium text-slate-600">20 hrs/wk</span>
                  </div>
                )}
              </div>
            </div>

            {/* Employment outcome */}
            {(p.enrollment_status === 'completed' || p.enrollment_status === 'exited') && (
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Employment Outcome</h3>
                {p.employed_at_exit ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="font-semibold text-emerald-600">Employed</span>
                    </div>
                    {p.employer_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Employer</span>
                        <span className="font-medium text-slate-800">{p.employer_name}</span>
                      </div>
                    )}
                    {p.job_title && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Title</span>
                        <span className="font-medium text-slate-800">{p.job_title}</span>
                      </div>
                    )}
                    {p.hourly_wage && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Wage</span>
                        <span className="font-bold text-slate-900">${p.hourly_wage}/hr</span>
                      </div>
                    )}
                    {p.hours_per_week && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hours/week</span>
                        <span className="font-medium text-slate-800">{p.hours_per_week}</span>
                      </div>
                    )}
                    {p.employment_start_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Start date</span>
                        <span className="font-medium text-slate-800">{fmtDate(p.employment_start_date)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Not employed at exit</p>
                )}
              </div>
            )}

            {/* Exit form */}
            {p.enrollment_status === 'active' && (
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Record Exit</h3>
                <ParticipantExitForm
                  participantId={p.id}
                  initialData={{
                    exit_reason:            p.exit_reason,
                    employed_at_exit:       p.employed_at_exit,
                    employer_name:          p.employer_name,
                    job_title:              p.job_title,
                    hourly_wage:            p.hourly_wage,
                    hours_per_week:         p.hours_per_week,
                    employment_start_date:  p.employment_start_date,
                    credential_attained:    (p as Record<string, unknown>).credential_attained as boolean | null,
                    credential_name:        (p as Record<string, unknown>).credential_name as string | null,
                    credential_issued_date: (p as Record<string, unknown>).credential_issued_date as string | null,
                    abawd_exempt:           (p as Record<string, unknown>).abawd_exempt as boolean | null,
                    abawd_exemption_reason: (p as Record<string, unknown>).abawd_exemption_reason as string | null,
                    exit_notes:             (p as Record<string, unknown>).exit_notes as string | null,
                  }}
                />
              </div>
            )}

            {/* Follow-up schedule — shown after exit */}
            {(p.enrollment_status === 'exited' || p.enrollment_status === 'completed') && (
              (() => {
                const q2Date = (p as Record<string, unknown>).q2_follow_up_date as string | null;
                const q4Date = (p as Record<string, unknown>).q4_follow_up_date as string | null;
                const q2Done = (p as Record<string, unknown>).q2_follow_up_completed as boolean | null;
                const q4Done = (p as Record<string, unknown>).q4_follow_up_completed as boolean | null;
                if (!q2Date && !q4Date) return null;
                return (
                  <div className="bg-white rounded-xl border shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Follow-up Schedule</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {q2Date && (
                        <div className={`rounded-lg p-3 border ${q2Done ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                          <span className="text-xs text-slate-500 block mb-0.5">Q2 follow-up</span>
                          <span className="font-semibold">{fmtDate(q2Date)}</span>
                          <span className={`text-xs block mt-0.5 font-medium ${q2Done ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {q2Done ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      )}
                      {q4Date && (
                        <div className={`rounded-lg p-3 border ${q4Done ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                          <span className="text-xs text-slate-500 block mb-0.5">Q4 follow-up</span>
                          <span className="font-semibold">{fmtDate(q4Date)}</span>
                          <span className={`text-xs block mt-0.5 font-medium ${q4Done ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {q4Done ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Quick links */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/admin/fssa-impact/attendance" className="block text-sm text-blue-600 hover:underline">
                  → Record attendance
                </Link>
                <Link href="/admin/fssa-impact/budget" className="block text-sm text-blue-600 hover:underline">
                  → Budget tracker
                </Link>
                <Link href="/admin/fssa-impact/participants" className="block text-sm text-blue-600 hover:underline">
                  → All participants
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
