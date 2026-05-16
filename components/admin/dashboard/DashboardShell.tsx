// Server component — no "use client", no useState, no useEffect.
// Operational command center layout — all data is real and DB-driven.

import Link from "next/link";
import Image from "next/image";
import SitePreviewPanelWrapper from './SitePreviewPanelWrapper';
import { AdminGreeting } from "@/components/admin/AdminGreeting";
import {
  ArrowRight, AlertTriangle, CheckCircle2,
  ShieldAlert, Users, FileText,
  Activity, TrendingUp, Inbox,
} from "lucide-react";
import type { AdminDashboardData, InactiveLearner, StaleLeadItem } from "./types";
import { OperationalAlerts } from "./OperationalAlerts";


function fmtUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
function fmtNum(n: number) { return new Intl.NumberFormat("en-US").format(n); }
function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function Empty({ message }: { message: string }) {
  return <p className="text-slate-400 text-sm py-6 text-center">{message}</p>;
}

const DEGRADED_LABELS: Record<string, string> = {
  inactive_learners: "Inactive learners",
  unpublished_programs: "Unpublished programs",
  recent_students: "Recent students",
  enrollments_by_program: "Enrollment breakdown",
};
function DegradedBanner({ sections }: { sections: string[] }) {
  if (!sections.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 mb-6">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <span className="font-semibold">Some sections are temporarily unavailable.</span>
        {" "}KPI counts are accurate.{" "}
        {sections.map(s => DEGRADED_LABELS[s] ?? s).join(", ")} could not be loaded.
      </div>
    </div>
  );
}

function PriorityStrip({ data }: { data: AdminDashboardData }) {
  const { operational } = data;
  const cards = [
    {
      title: "Needs Review",
      value: fmtNum(operational.needsReview),
      detail: operational.needsReviewDetail,
      href: "/admin/applications?status=submitted",
      urgent: operational.needsReview > 0,
      cta: "Open queue",
    },
    {
      title: "At Risk",
      value: fmtNum(operational.atRisk),
      detail: operational.atRisk > 0 ? `${operational.atRisk} inactive 7+ days` : "No learners currently flagged",
      href: "/admin/at-risk",
      urgent: operational.atRisk > 0,
      cta: "View learners",
    },
    {
      title: "Compliance Alerts",
      value: fmtNum(operational.complianceAlerts),
      detail: operational.complianceAlerts > 0
        ? (operational.complianceAlertsSeverity === "critical" ? "Critical issues need action" : "Unresolved alerts")
        : "You're caught up",
      href: "/admin/compliance",
      urgent: operational.complianceAlerts > 0,
      cta: "Open alerts",
    },
    {
      title: "New Today",
      value: fmtNum(operational.newToday),
      detail: operational.newTodayDetail,
      href: "/admin/activity",
      urgent: false,
      cta: "View activity",
    },
    {
      title: "Revenue This Month",
      value: fmtUsd(operational.revenueThisMonthCents),
      detail: "From completed transactions",
      href: "/admin/enrollments?payment_status=paid",
      urgent: false,
      cta: "View revenue",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}
          className={`group rounded-xl border p-4 bg-white hover:shadow-md transition-shadow ${card.urgent ? "border-rose-200 bg-rose-50" : "border-slate-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${card.urgent ? "text-rose-600" : "text-slate-500"}`}>{card.title}</p>
          <p className={`text-3xl font-black tabular-nums mb-1 ${card.urgent ? "text-rose-700" : "text-slate-900"}`}>{card.value}</p>
          <p className="text-xs text-slate-500 mb-3 leading-snug">{card.detail}</p>
          <span className="text-xs font-semibold text-brand-blue-600 group-hover:underline flex items-center gap-1">
            {card.cta} <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      ))}
    </div>
  );
}

const SEVERITY_STYLES = {
  critical: { dot: "bg-rose-500",    label: "CRITICAL", text: "text-rose-700",  bg: "bg-rose-50"    },
  high:     { dot: "bg-orange-500",  label: "HIGH",     text: "text-orange-700",bg: "bg-orange-50"  },
  medium:   { dot: "bg-yellow-400",  label: "MEDIUM",   text: "text-yellow-700",bg: "bg-yellow-50"  },
  low:      { dot: "bg-slate-300",   label: "LOW",      text: "text-slate-500", bg: "bg-white"      },
} as const;

function TodaysPriorities({ data }: { data: AdminDashboardData }) {
  const items = data.priorities ?? [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Today's Priorities</h2>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-slate-400">Ranked by impact score</span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-8 flex items-center gap-3 text-brand-green-700">
          <CheckCircle2 className="w-5 h-5 text-brand-green-500 flex-shrink-0" />
          <p className="text-sm font-medium">No urgent operational items right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const s = SEVERITY_STYLES[item.severity];
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center justify-between px-6 py-4 hover:brightness-95 group transition-all ${s.bg}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-black tracking-widest ${s.text}`}>{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">score {item.score}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.context}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0 ml-4" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LearnersNeedingAttention({ learners }: { learners: InactiveLearner[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Learners Needing Attention</h2>
        </div>
        <Link href="/admin/at-risk" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {learners.length === 0 ? (
        <Empty message="No learners currently need intervention." />
      ) : (
        <div className="divide-y divide-slate-100">
          {learners.slice(0, 6).map((l) => (
            <Link key={l.enrollmentId} href={l.href} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 group transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{l.fullName ?? l.email ?? "Unknown learner"}</p>
                <p className="text-xs text-slate-500 truncate">{l.programTitle ?? "Unknown program"}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Inactive {l.daysInactive}d</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewQueues({ data }: { data: AdminDashboardData }) {
  const queues = [
    { label: "Applications awaiting review", count: data.counts.pendingApplications, context: data.counts.pendingApplications > 0 ? "Intake queue needs admin action" : "Queue is clear", href: "/admin/applications?status=submitted", urgent: data.counts.pendingApplications > 0 },
    { label: "WIOA documents awaiting review", count: data.pendingWioaDocs, context: data.pendingWioaDocs > 0 ? "Funding eligibility may be blocked" : "Queue is clear", href: "/admin/wioa/documents", urgent: data.pendingWioaDocs > 0 },
    { label: "Lab submissions awaiting sign-off", count: data.pendingSubmissions.length, context: data.pendingSubmissions.length > 0 ? "Instructor action required" : "Queue is clear", href: "/admin/submissions", urgent: data.pendingSubmissions.length > 0 },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <h2 className="font-bold text-slate-900">Review Queues</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {queues.map((q) => (
          <Link key={q.label} href={q.href} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 group transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-900">{q.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{q.context}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <span className={`text-lg font-black tabular-nums ${q.urgent ? "text-rose-600" : "text-slate-400"}`}>{q.count}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CrmFollowUpQueue({ leads }: { leads: StaleLeadItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Follow-Up Queue</h2>
        </div>
        <Link href="/admin/crm/leads" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {leads.length === 0 ? (
        <Empty message="No CRM follow-ups need attention today." />
      ) : (
        <div className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <Link key={lead.id} href={lead.href} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 group transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{lead.name ?? "Unknown lead"}</p>
                <p className="text-xs text-slate-500">{lead.status ?? "No status"}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{lead.days_stale}d no activity</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplianceSnapshot({ data }: { data: AdminDashboardData }) {
  const rows = [
    { label: data.operational.complianceAlerts > 0 ? `${data.operational.complianceAlerts} unresolved alert${data.operational.complianceAlerts !== 1 ? "s" : ""}` : "No unresolved compliance alerts", urgent: data.operational.complianceAlerts > 0, href: "/admin/compliance" },
    { label: data.pendingWioaDocs > 0 ? `${data.pendingWioaDocs} required WIOA document${data.pendingWioaDocs !== 1 ? "s" : ""} pending` : "No WIOA documents pending", urgent: data.pendingWioaDocs > 0, href: "/admin/wioa/documents" },
    { label: data.systemHealth.missingDocuments > 0 ? `${data.systemHealth.missingDocuments} enrollment${data.systemHealth.missingDocuments !== 1 ? "s" : ""} missing required documents` : "All enrollments have required documents", urgent: data.systemHealth.missingDocuments > 0, href: "/admin/enrollments?docs_verified=false" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-slate-500" />
        <h2 className="font-bold text-slate-900">Compliance Snapshot</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <Link key={i} href={row.href} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 group transition-colors">
            {row.urgent ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-brand-green-500 flex-shrink-0" />}
            <p className={`text-sm flex-1 ${row.urgent ? "font-semibold text-slate-900" : "text-slate-600"}`}>{row.label}</p>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-slate-100">
        <Link href="/admin/compliance" className="text-xs font-semibold text-brand-blue-600 hover:underline">Open compliance dashboard →</Link>
      </div>
    </div>
  );
}

function RecentActivity({ items }: { items: { id: string; title: string; timestamp: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-500" />
        <h2 className="font-bold text-slate-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-center justify-between px-6 py-3">
            <p className="text-sm text-slate-700 truncate flex-1">{item.title}</p>
            <p className="text-xs text-slate-400 flex-shrink-0 ml-4">{relativeTime(item.timestamp)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardContent({ data }: { data: AdminDashboardData }) {
  const firstName = data.profile?.full_name?.split(' ')[0] ?? 'Admin';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="pb-16">
      <div className="relative w-full h-40 sm:h-56 overflow-hidden">
        <Image
          src="/images/pages/admin-dashboard-hero.webp"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </div>

        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-0.5" suppressHydrationWarning>
            <AdminGreeting name={firstName} /> · {today}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor operations, learner progress, compliance, and revenue.</p>
        </div>
        {/* Quick-action strip — horizontally scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
          <Link href="/admin/applications?status=submitted" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">Review Applications</Link>
          <Link href="/admin/compliance" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Compliance</Link>
          <Link href="/admin/documents/templates" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Document Templates</Link>
          <Link href="/admin/course-builder/templates" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Course Templates</Link>
          <Link href="/admin/crm/leads" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">CRM Queue</Link>
          <Link href="/admin/students" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Students</Link>
          <Link href="/admin/enrollments" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Enrollments</Link>
          <Link href="/admin/reports" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Reports</Link>
          <Link href="/admin/dev-studio" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Dev Studio</Link>
        </div>

        <DegradedBanner sections={data.degradedSections ?? []} />

        {/* Priority KPI Strip */}
        <PriorityStrip data={data} />

        {/* Operational alerts — stalled apps, missing outcomes, missing funding */}
        <OperationalAlerts data={data} />

        {/* Today's Priorities */}
        <TodaysPriorities data={data} />

        {/* Two-column operational grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 min-w-0">
            <LearnersNeedingAttention learners={data.inactiveLearners} />
            <ReviewQueues data={data} />
            <CrmFollowUpQueue leads={data.staleLeads} />
          </div>
          <div>
            <ComplianceSnapshot data={data} />
            <RecentActivity items={data.recentActivity} />

          </div>
        </div>

        {/* Performance Trends — secondary */}
        {data.topPrograms.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Performance Trends</p>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Top Programs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.topPrograms.slice(0, 6).map((p) => (
                <Link key={p.id} href={`/admin/programs/${p.id}`} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-slate-900 text-sm truncate mb-3">{p.title}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-900">{p.learners}</p>
                      <p className="text-xs text-slate-500">active learners</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-green-600">{p.completionRate}%</p>
                      <p className="text-xs text-slate-500">completion</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Live site preview */}
        <div className="mt-8">
          <SitePreviewPanelWrapper sites={data.sitePreviewTargets ?? []} />
        </div>

      </div>
    </div>
  );
}
