// Server component — props-only, no client hooks.
// Data is loaded in app/admin/fssa-impact/page.tsx and passed as props.

import Link from 'next/link';
import { Users, Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export interface FssaParticipantSummary {
  total: number;
  active: number;
  completed: number;
  exited: number;
  employed_at_exit: number;
  abawd_count: number;
}

export interface FssaBudgetSummary {
  fiscal_year: string;
  total_budgeted: number;
  total_expended: number;
  estimated_reimbursement: number;
}

export interface FssaComplianceAlert {
  type: 'hours_deficit' | 'missing_attendance' | 'exit_overdue' | 'budget_threshold';
  participant_name?: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface FssaDashboardProps {
  participants: FssaParticipantSummary;
  budget: FssaBudgetSummary | null;
  alerts: FssaComplianceAlert[];
}

const SEVERITY_STYLES: Record<string, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-blue-200 bg-blue-50 text-blue-800',
};

function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'amber' | 'slate';
}) {
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-600 bg-slate-50',
  };
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`p-2 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function FssaDashboard({ participants, budget, alerts }: FssaDashboardProps) {
  const placementRate =
    participants.completed > 0
      ? Math.round((participants.employed_at_exit / participants.completed) * 100)
      : 0;

  const highAlerts = alerts.filter((a) => a.severity === 'high');

  return (
    <div className="space-y-8">
      {/* Compliance alerts */}
      {highAlerts.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-rose-800">
              {highAlerts.length} compliance issue{highAlerts.length !== 1 ? 's' : ''} require attention
            </h3>
          </div>
          <ul className="space-y-1">
            {highAlerts.map((a, i) => (
              <li key={i} className="text-sm text-rose-700">
                {a.participant_name ? <strong>{a.participant_name}: </strong> : null}
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Participant stats */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Participant Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Enrolled" value={participants.total} icon={Users} color="blue" />
          <StatCard
            label="Active"
            value={participants.active}
            sub={`${participants.abawd_count} ABAWD`}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Completed"
            value={participants.completed}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Job Placement Rate"
            value={`${placementRate}%`}
            sub={`${participants.employed_at_exit} of ${participants.completed} completers`}
            icon={TrendingUp}
            color="green"
          />
        </div>
      </section>

      {/* Budget summary */}
      {budget && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Budget — {budget.fiscal_year}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Budgeted"
              value={fmt$(budget.total_budgeted)}
              icon={DollarSign}
              color="slate"
            />
            <StatCard
              label="Expended"
              value={fmt$(budget.total_expended)}
              sub={`${Math.round((budget.total_expended / (budget.total_budgeted || 1)) * 100)}% of budget`}
              icon={DollarSign}
              color="amber"
            />
            <StatCard
              label="Est. SNAP E&T Reimbursement (50%)"
              value={fmt$(budget.estimated_reimbursement)}
              sub="Based on expended costs"
              icon={DollarSign}
              color="green"
            />
          </div>
        </section>
      )}

      {/* All alerts */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Compliance Alerts
          </h2>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`rounded-lg border p-3 ${SEVERITY_STYLES[alert.severity]}`}>
                <p className="text-sm">
                  {alert.participant_name ? (
                    <strong className="mr-1">{alert.participant_name}:</strong>
                  ) : null}
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/fssa-impact/participants"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Users className="w-4 h-4" />
            Manage Participants
          </Link>
          <Link
            href="/admin/fssa-impact/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            <Clock className="w-4 h-4" />
            Record Attendance
          </Link>
          <Link
            href="/admin/fssa-impact/budget"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            <DollarSign className="w-4 h-4" />
            Budget Tracker
          </Link>
        </div>
      </section>
    </div>
  );
}
