// Server component — no client state needed.
// Surfaces three operational alert categories that require admin action.

import Link from 'next/link';
import { AlertTriangle, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import type { AdminDashboardData } from './types';

interface AlertRowProps {
  label: string;
  href: string;
  detail?: string;
}

function AlertRow({ label, href, detail }: AlertRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-3 hover:bg-amber-50 transition-colors group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
      <span className="text-xs text-amber-600 font-medium ml-4 shrink-0 group-hover:underline">
        Review →
      </span>
    </Link>
  );
}

interface AlertSectionProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  viewAllHref: string;
  children: React.ReactNode;
}

function AlertSection({ icon, title, count, viewAllHref, children }: AlertSectionProps) {
  if (count === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-white overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-amber-900">{title}</span>
          <span className="text-xs font-bold bg-amber-200 text-amber-800 rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
        <Link href={viewAllHref} className="text-xs text-amber-700 hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

export function OperationalAlerts({ data }: { data: AdminDashboardData }) {
  const { stalledApplications, noOutcomeEnrollments, missingFundingEnrollments } = data;

  const totalAlerts =
    stalledApplications.length + noOutcomeEnrollments.length + missingFundingEnrollments.length;

  if (totalAlerts === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 mb-6">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-800">
          No operational alerts — applications, outcomes, and funding are all current.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest text-xs">
          Needs Attention
        </p>
        <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
          {totalAlerts}
        </span>
      </div>

      {/* Stalled applications */}
      <AlertSection
        icon={<Clock className="h-4 w-4 text-amber-600" />}
        title="Applications stalled 7+ days"
        count={stalledApplications.length}
        viewAllHref="/admin/applications?status=submitted"
      >
        {stalledApplications.map((app: any) => {
          const name =
            app.full_name ||
            [app.first_name, app.last_name].filter(Boolean).join(' ') ||
            app.email ||
            'Unknown';
          const ageDays = Math.floor(
            (Date.now() - new Date(app.submitted_at || app.created_at).getTime()) / 86400000,
          );
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const reviewHref = UUID_RE.test(app.id)
            ? `/admin/applications/review/${app.id}`
            : `/admin/applications?search=${encodeURIComponent(app.email || app.id)}`;
          return (
            <AlertRow
              key={app.id}
              href={reviewHref}
              label={name}
              detail={`${ageDays}d in ${app.status} · ${app.program_interest ?? app.program_slug ?? 'unknown program'}`}
            />
          );
        })}
      </AlertSection>

      {/* No outcome after completion */}
      <AlertSection
        icon={<CheckCircle2 className="h-4 w-4 text-amber-600" />}
        title="Enrolled — no placement or credential outcome"
        count={noOutcomeEnrollments.length}
        viewAllHref="/admin/reports/wioa"
      >
        {noOutcomeEnrollments.map((enr: any) => {
          const id = enr.enrollment_id as string;
          const name = enr.full_name || enr.email || id?.slice(0, 8) + '…';
          return (
            <AlertRow
              key={id}
              href={`/admin/enrollments/${id}`}
              label={name}
              detail={`${enr.program_title ?? 'unknown program'} · no placement or credential`}
            />
          );
        })}
      </AlertSection>

      {/* Missing funding source */}
      <AlertSection
        icon={<DollarSign className="h-4 w-4 text-amber-600" />}
        title="Active enrollments — no funding source"
        count={missingFundingEnrollments.length}
        viewAllHref="/admin/reports/wioa?status=active"
      >
        {missingFundingEnrollments.map((enr: any) => {
          const id = enr.enrollment_id as string;
          const name = enr.full_name || enr.email || id?.slice(0, 8) + '…';
          return (
            <AlertRow
              key={id}
              href={`/admin/enrollments/${id}`}
              label={name}
              detail={`${enr.program_title ?? 'unknown program'} · funding source not set`}
            />
          );
        })}
      </AlertSection>
    </div>
  );
}
