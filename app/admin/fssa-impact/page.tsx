import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import FssaDashboard, {
  type FssaDashboardProps,
  type FssaComplianceAlert,
} from '@/components/admin/fssa/FssaDashboard';
import { FileText, Users, Clock, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FSSA SNAP E&T Dashboard | Admin | Elevate for Humanity',
  description: 'SNAP Employment & Training participant tracking, attendance, and budget management.',
};

// Current Indiana state fiscal year (July 1 – June 30)
function currentFY(): string {
  const now = new Date();
  return now.getMonth() >= 6 ? `FY${now.getFullYear() + 1}` : `FY${now.getFullYear()}`;
}

export default async function FssaImpactAdminPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();
  if (!db) notFound();
  const fy = currentFY();

  // Parallel data fetch — all queries are safe-fallback (tables may not exist yet)
  const [participantsRes, budgetRes, attendanceRes] = await Promise.all([
    db
      .from('fssa_participants')
      .select('id, enrollment_status, abawd, employed_at_exit, snap_et_enrolled_at')
      .limit(1000),
    db
      .from('fssa_budget')
      .select('budgeted_amount, expended_amount, encumbered')
      .eq('fiscal_year', fy),
    // Fetch recent attendance to detect ABAWD hours deficits
    db
      .from('fssa_attendance')
      .select('participant_id, session_date, hours_attended, present')
      .gte('session_date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .limit(2000),
  ]);

  const participants = participantsRes.data ?? [];
  const budgetRows = budgetRes.data ?? [];
  const recentAttendance = attendanceRes.data ?? [];

  // Participant summary
  const participantSummary: FssaDashboardProps['participants'] = {
    total: participants.length,
    active: participants.filter((p) => p.enrollment_status === 'active').length,
    completed: participants.filter((p) => p.enrollment_status === 'completed').length,
    exited: participants.filter((p) => p.enrollment_status === 'exited').length,
    employed_at_exit: participants.filter((p) => p.employed_at_exit === true).length,
    abawd_count: participants.filter((p) => p.abawd === true).length,
  };

  // Budget summary
  const budgetSummary: FssaDashboardProps['budget'] =
    budgetRows.length > 0
      ? {
          fiscal_year: fy,
          total_budgeted: budgetRows.reduce((s, r) => s + (r.budgeted_amount ?? 0), 0),
          total_expended: budgetRows.reduce((s, r) => s + (r.expended_amount ?? 0), 0),
          estimated_reimbursement:
            budgetRows.reduce((s, r) => s + (r.expended_amount ?? 0), 0) * 0.5,
        }
      : null;

  // Compliance alerts — detect ABAWD participants with < 20 hrs in the past week
  const alerts: FssaComplianceAlert[] = [];

  // Group attendance by participant for the past 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weeklyHours: Record<string, number> = {};
  for (const row of recentAttendance) {
    if (row.present && row.session_date >= oneWeekAgo) {
      weeklyHours[row.participant_id] =
        (weeklyHours[row.participant_id] ?? 0) + (row.hours_attended ?? 0);
    }
  }

  const abawdIds = new Set(
    participants.filter((p) => p.abawd && p.enrollment_status === 'active').map((p) => p.id),
  );

  for (const id of abawdIds) {
    const hrs = weeklyHours[id] ?? 0;
    if (hrs < 20) {
      alerts.push({
        type: 'hours_deficit',
        message: `ABAWD participant logged only ${hrs} hrs this week (minimum 20 required for SNAP eligibility).`,
        severity: hrs < 10 ? 'high' : 'medium',
      });
    }
  }

  if (participants.length === 0) {
    alerts.push({
      type: 'missing_attendance',
      message: 'No participants enrolled yet. Add participants via the intake form.',
      severity: 'low',
    });
  }

  const dashboardProps: FssaDashboardProps = {
    participants: participantSummary,
    budget: budgetSummary,
    alerts,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FSSA SNAP E&T</h1>
            <p className="text-sm text-slate-500 mt-1">
              Indiana SNAP Employment &amp; Training (IMPACT) — participant tracking &amp; compliance
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/fssa-impact/intake"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <Users className="w-4 h-4" />
              New Intake
            </Link>
            <Link
              href="/admin/fssa-impact/attendance"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              <Clock className="w-4 h-4" />
              Attendance
            </Link>
            <Link
              href="/admin/fssa-impact/budget"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              <DollarSign className="w-4 h-4" />
              Budget
            </Link>
          </div>
        </div>

        {/* Dashboard */}
        <FssaDashboard {...dashboardProps} />

        {/* Program survey summary — FSSA TPP required fields */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            FSSA TPP Survey — Program Projections
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Program Type', value: 'Short-term vocational training' },
              { label: 'Target Population', value: 'SNAP recipients (ABAWD priority)' },
              { label: 'Weekly Hours (min)', value: '20 hrs structured + 10 hrs supervised' },
              { label: 'Counties Served', value: 'Marion + statewide Indiana' },
              { label: 'Delivery Mode', value: 'Hybrid / In-person' },
              { label: 'SNAP E&T Reimbursement', value: '50% of eligible costs' },
              { label: 'Credential Attainment Target', value: '87%' },
              { label: 'Job Placement Target (90-day)', value: '74%' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className="font-medium text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            These projections are entered into the FSSA TPP system. Update via the FSSA portal when
            actuals diverge by &gt;10%.
          </p>
        </section>

        {/* Eligible programs */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            SNAP E&T Eligible Programs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Program</th>
                  <th className="pb-2 pr-4">Credential</th>
                  <th className="pb-2 pr-4">Hours</th>
                  <th className="pb-2">Weekly Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'HVAC Technician', credential: 'EPA 608', hours: '160 hrs', weekly: 30 },
                  { name: 'CNA / Healthcare', credential: 'State CNA License', hours: '120 hrs', weekly: 30 },
                  { name: 'CDL Training', credential: 'Class A CDL', hours: '160 hrs', weekly: 30 },
                  { name: 'IT Help Desk', credential: 'CompTIA A+', hours: '160 hrs', weekly: 30 },
                  { name: 'Peer Recovery Specialist', credential: 'CPRS', hours: '80 hrs', weekly: 20 },
                  { name: 'Barber Apprenticeship', credential: 'Indiana Barber License', hours: '2,000 hrs OJL', weekly: 40 },
                ].map((p) => (
                  <tr key={p.name} className="text-slate-700">
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4 text-slate-500">{p.credential}</td>
                    <td className="py-2 pr-4">{p.hours}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.weekly >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.weekly} hrs/wk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
