// Server component — no "use client", no useState, no useEffect.
// Operational command center layout — all data is real and DB-driven.

import Link from "next/link";
import Image from "next/image";
import SitePreviewPanelWrapper from './SitePreviewPanelWrapper';
import { AdminGreeting } from "@/components/admin/AdminGreeting";
import {
  ArrowRight, AlertTriangle, CheckCircle2,
  Activity, TrendingUp, Inbox,
} from "lucide-react";
import type { AdminDashboardData, InactiveLearner, StaleLeadItem } from "./types";
import { OperationalAlerts } from "./OperationalAlerts";
import { LearnerActionButtons } from "./LearnerActionButtons";
import { LeadActionButtons } from "./LeadActionButtons";
import { ProgramIntegrityPanel } from "./ProgramIntegrityPanel";
import { SystemHealthPanel } from "./SystemHealthPanel";
import { KpiGrid } from "./KpiGrid";
import { BlockedProgramsList } from "./BlockedProgramsList";
import { RecentApplicationsList } from "./RecentApplicationsList";


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
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Today's Priorities</h2>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-slate-400 hidden sm:block">Ranked by impact score</span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="px-4 sm:px-6 py-8 flex items-center gap-3 text-brand-green-700">
          <CheckCircle2 className="w-5 h-5 text-brand-green-500 flex-shrink-0" />
          <p className="text-sm font-medium">No urgent operational items right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const s = SEVERITY_STYLES[item.severity];
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:brightness-95 group transition-all ${s.bg}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-black tracking-widest ${s.text}`}>{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">score {item.score}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.context}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0 ml-3" />
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
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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
            <div key={l.enrollmentId} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={l.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{l.fullName ?? l.email ?? "Unknown learner"}</p>
                <p className="text-xs text-slate-500 truncate">{l.programTitle ?? "Unknown program"}</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Inactive {l.daysInactive}d</span>
                <LearnerActionButtons
                  studentId={l.userId}
                  enrollmentId={l.enrollmentId}
                  studentName={l.fullName ?? l.email ?? "learner"}
                />
              </div>
            </div>
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
    { label: "Program holders awaiting approval", count: data.counts.pendingProgramHolders, context: data.counts.pendingProgramHolders > 0 ? "Partner applications need review" : "Queue is clear", href: "/admin/program-holders", urgent: data.counts.pendingProgramHolders > 0 },
    { label: "Program holder documents pending", count: data.counts.pendingDocuments, context: data.counts.pendingDocuments > 0 ? "Documents submitted, awaiting review" : "Queue is clear", href: "/admin/program-holder-documents", urgent: data.counts.pendingDocuments > 0 },
    { label: "Certificates to issue", count: data.counts.certificatesIssued, context: "Completed learners awaiting credential", href: "/admin/certificates", urgent: false },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
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
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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
            <div key={lead.id} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={lead.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{lead.name ?? "Unknown lead"}</p>
                <p className="text-xs text-slate-500">{lead.status ?? "No status"}</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{lead.days_stale}d no activity</span>
                <LeadActionButtons leadId={lead.id} leadName={lead.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function RecentActivity({ items }: { items: { id: string; title: string; timestamp: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-500" />
        <h2 className="font-bold text-slate-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 sm:px-6 py-3">
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
        {/* Quick-action strip — mobile only. Desktop has the full nav bar. */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
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

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        {data.kpis.length > 0 && (
          <div className="mb-6">
            <KpiGrid kpis={data.kpis} />
          </div>
        )}

        {/* ── Operational alerts: stalled apps, missing outcomes, funding ─ */}
        <OperationalAlerts data={data} />

        {/* ── Scored priority list ─────────────────────────────────────── */}
        <TodaysPriorities data={data} />

        {/* ── Main operational grid ────────────────────────────────────── */}
        {/* Left (2/3): action queues — learners, review queues, CRM       */}
        {/* Right (1/3): activity feed + recent applications               */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
          <div className="lg:col-span-2 min-w-0 space-y-4">
            <LearnersNeedingAttention learners={data.inactiveLearners} />
            <ReviewQueues data={data} />
            <CrmFollowUpQueue leads={data.staleLeads} />
          </div>
          <div className="space-y-4">
            <RecentActivity items={data.recentActivity} />
            {data.recentApplications.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-slate-500" />
                    <h2 className="font-bold text-slate-900 text-sm">Recent Applications</h2>
                  </div>
                  <Link href="/admin/applications" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <RecentApplicationsList items={data.recentApplications} />
              </div>
            )}
          </div>
        </div>

        {/* ── Top programs + unpublished programs ──────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.topPrograms.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <h2 className="font-bold text-slate-900">Top Programs</h2>
                </div>
                <Link href="/admin/programs" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
                  All programs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {data.topPrograms.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/admin/programs/${p.id}`}
                    className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-4">{p.enrollmentCount} enrolled</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {data.blockedPrograms.length > 0 && (
            <BlockedProgramsList items={data.blockedPrograms} />
          )}
        </div>

        {/* ── Program integrity ────────────────────────────────────────── */}
        <div className="mt-8">
          <ProgramIntegrityPanel />
        </div>

        {/* ── Site status + system health ──────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SitePreviewPanelWrapper sites={data.sitePreviewTargets ?? []} />
          <SystemHealthPanel health={data.systemHealth} />
        </div>

      </div>
    </div>
  );
}
