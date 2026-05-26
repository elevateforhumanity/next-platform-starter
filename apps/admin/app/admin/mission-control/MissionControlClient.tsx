'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Activity, AlertTriangle, Bot, CheckCircle, Database,
  DatabaseBackup, FileSearch, RefreshCw, Server, Shield,
  Terminal, TrendingUp, Users, Zap, XCircle, Mail,
  Clock, BookOpen, Bell,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape passed from the server component (page.tsx) */
type Snapshot = {
  students: number;
  activeEnrollments: number;
  pendingApplications: number;
  openAtRisk: number;
  publishedPrograms: number;
  activeCourses: number;
  pendingDocuments: number;
  fetchedAt: string;
};

type AIStatus = {
  activeProvider: string | null;
  providers: { name: string; configured: boolean }[];
};

type SystemStatus = {
  overall: 'healthy' | 'degraded' | 'down';
  checks: {
    database: { status: string; connected: boolean };
    redis: { status: string; connected: boolean };
    stripe: { status: string; configured: boolean };
    email: { status: string; configured: boolean };
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; href?: string;
}) {
  const content = (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
  );
}

function SectionHeader({ title, href, icon: Icon }: { title: string; href: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />
        {title}
      </h2>
      <Link href={href} className="text-xs text-brand-blue-400 hover:text-brand-blue-300 transition-colors">
        View all →
      </Link>
    </div>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

const SNAPSHOT_COLORS: Record<string, string> = {
  pre_migration: 'text-amber-400',
  pre_deploy: 'text-blue-400',
  pre_config_change: 'text-purple-400',
  manual: 'text-slate-400',
};

// ─── Main component ───────────────────────────────────────────────────────────

type AuditLog = { id: string; action: string; created_at: string; user_id: string };
type SnapshotRow = { id: string; snapshot_type: string; label: string; rolled_back: boolean; created_at: string };

type ClockInEntry = {
  id: string; apprentice_id: string; student_name: string;
  clock_in_at: string; clock_out_at: string | null;
  is_active: boolean; duration_min: number | null;
  program_id: string | null; work_date: string | null;
};
type PlatformAlert = {
  id: string; event_type: string; category: string;
  severity: string; message: string | null;
  created_at: string; resolved: boolean;
  payload: Record<string, unknown>;
};
type LessonActivity = {
  id: string; user_id: string; student_name: string;
  lesson_id: string; completed_at: string | null; created_at: string;
};

export default function MissionControlClient({ snapshot }: { snapshot: Snapshot }) {
  const [counts, setCounts] = useState<Snapshot>(snapshot);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date(snapshot.fetchedAt));
  // Live ops state
  const [clockIns, setClockIns] = useState<ClockInEntry[]>([]);
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [lessonActivity, setLessonActivity] = useState<LessonActivity[]>([]);
  const [liveOpsSummary, setLiveOpsSummary] = useState<{ activeClockIns: number; unresolvedAlerts: number; lessonCompletions24h: number } | null>(null);

  // ── Platform health + recent activity + live ops polling (30s) ───────────
  const fetchLiveStatus = useCallback(async () => {
    const [healthRes, activityRes, liveOpsRes] = await Promise.all([
      fetch('/api/admin/platform-health').catch(() => null),
      fetch('/api/admin/mission-control/activity').catch(() => null),
      fetch('/api/admin/mission-control/live-ops').catch(() => null),
    ]);

    if (healthRes?.ok) {
      const health = await healthRes.json();
      setAiStatus({
        activeProvider: health.ai?.activeProvider ?? null,
        providers: health.ai?.providers ?? [],
      });
      setSysStatus({
        overall: health.overall,
        checks: {
          database: { status: health.services?.database?.status, connected: health.services?.database?.status === 'healthy' },
          redis:    { status: health.services?.redis?.status,    connected: health.services?.redis?.status === 'healthy' },
          stripe:   { status: health.services?.stripe?.status,   configured: health.services?.stripe?.configured },
          email:    { status: health.services?.email?.status,    configured: health.services?.email?.configured },
        },
      });
    }

    if (activityRes?.ok) {
      const activity = await activityRes.json();
      setAuditLogs(activity.auditLogs ?? []);
      setSnapshots(activity.snapshots ?? []);
    }

    if (liveOpsRes?.ok) {
      const liveOps = await liveOpsRes.json();
      setClockIns(liveOps.clockIns ?? []);
      setAlerts(liveOps.alerts ?? []);
      setLessonActivity(liveOps.recentLessonActivity ?? []);
      setLiveOpsSummary(liveOps.summary ?? null);
    }

    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  // ── Supabase realtime — live count updates ─────────────────────────────────
  useEffect(() => {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const sb = createClient(url, key);

    const channel = sb.channel('mission-control-counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        setCounts(c => ({ ...c, students: c.students + 1 }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'program_enrollments' }, () => {
        setCounts(c => ({ ...c, activeEnrollments: c.activeEnrollments + 1 }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'program_enrollments' }, (payload) => {
        // If status changed away from active, decrement
        if (payload.old?.status === 'active' && payload.new?.status !== 'active') {
          setCounts(c => ({ ...c, activeEnrollments: Math.max(0, c.activeEnrollments - 1) }));
        } else if (payload.old?.status !== 'active' && payload.new?.status === 'active') {
          setCounts(c => ({ ...c, activeEnrollments: c.activeEnrollments + 1 }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, (payload) => {
        if (payload.new?.status === 'pending') {
          setCounts(c => ({ ...c, pendingApplications: c.pendingApplications + 1 }));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, (payload) => {
        if (payload.old?.status === 'pending' && payload.new?.status !== 'pending') {
          setCounts(c => ({ ...c, pendingApplications: Math.max(0, c.pendingApplications - 1) }));
        } else if (payload.old?.status !== 'pending' && payload.new?.status === 'pending') {
          setCounts(c => ({ ...c, pendingApplications: c.pendingApplications + 1 }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents' }, (payload) => {
        if (payload.new?.status === 'pending_review') {
          setCounts(c => ({ ...c, pendingDocuments: c.pendingDocuments + 1 }));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'documents' }, (payload) => {
        if (payload.old?.status === 'pending_review' && payload.new?.status !== 'pending_review') {
          setCounts(c => ({ ...c, pendingDocuments: Math.max(0, c.pendingDocuments - 1) }));
        }
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveStatus();
    setRefreshing(false);
  };

  const dbConnected = sysStatus ? sysStatus.checks.database.connected : true;
  const overallHealth = !dbConnected ? 'down'
    : sysStatus?.overall === 'degraded' ? 'degraded'
    : 'healthy';

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mission Control</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Last updated {formatRelative(lastRefresh.toISOString())}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              overallHealth === 'healthy' ? 'bg-green-950/50 border-green-800 text-green-300' :
              overallHealth === 'degraded' ? 'bg-amber-950/50 border-amber-800 text-amber-300' :
              'bg-red-950/50 border-red-800 text-red-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                overallHealth === 'healthy' ? 'bg-green-400' :
                overallHealth === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              {overallHealth === 'healthy' ? 'All Systems Operational' :
               overallHealth === 'degraded' ? 'Degraded' : 'System Down'}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Students" value={counts.students} icon={Users} color="bg-blue-900/50 text-blue-400" href="/admin/students" />
          <StatCard label="Active Enrollments" value={counts.activeEnrollments} icon={TrendingUp} color="bg-green-900/50 text-green-400" href="/admin/enrollments" />
          <StatCard label="Pending Applications" value={counts.pendingApplications} icon={AlertTriangle} color={counts.pendingApplications > 0 ? "bg-amber-900/50 text-amber-400" : "bg-slate-800 text-slate-400"} href="/admin/applications" />
          <StatCard label="At-Risk Students" value={counts.openAtRisk} icon={Shield} color={counts.openAtRisk > 0 ? "bg-red-900/50 text-red-400" : "bg-slate-800 text-slate-400"} href="/admin/students?filter=at-risk" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Published Programs" value={counts.publishedPrograms} icon={Activity} color="bg-green-900/50 text-green-400" href="/admin/programs" />
          <StatCard label="Active Courses" value={counts.activeCourses} icon={Mail} color="bg-blue-900/50 text-blue-400" href="/admin/courses" />
          <StatCard label="Pending Documents" value={counts.pendingDocuments} icon={XCircle} color={counts.pendingDocuments > 0 ? "bg-amber-900/50 text-amber-400" : "bg-slate-800 text-slate-400"} href="/admin/documents" />
          <StatCard label="DB Status" value={dbConnected ? 'Connected' : 'Error'} icon={Database} color={dbConnected ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"} />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left col: System + AI status */}
          <div className="space-y-4">

            {/* System services */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <SectionHeader title="Services" href="/admin/system-health" icon={Server} />
              <div className="space-y-2">
                {sysStatus ? (
                  <>
                    {[
                      { label: 'Database', ok: sysStatus.checks.database.connected },
                      { label: 'Redis / Rate Limit', ok: sysStatus.checks.redis.connected },
                      { label: 'Stripe', ok: sysStatus.checks.stripe.configured },
                      { label: 'Email (SendGrid)', ok: sysStatus.checks.email.configured },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center justify-between py-1.5">
                        <span className="text-slate-300 text-sm">{label}</span>
                        <div className="flex items-center gap-1.5">
                          <StatusDot ok={ok} />
                          <span className={`text-xs ${ok ? 'text-green-400' : 'text-red-400'}`}>
                            {ok ? 'OK' : 'Error'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-slate-500 text-sm py-2">Loading…</p>
                )}
              </div>
              <Link href="/admin/monitoring" className="mt-3 block text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Full monitoring dashboard →
              </Link>
            </div>

            {/* AI providers */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <SectionHeader title="AI Providers" href="/admin/dev-studio?tab=ellie" icon={Bot} />
              {aiStatus ? (
                <div className="space-y-2">
                  {aiStatus.providers?.map((p) => (
                    <div key={p.name} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-300 text-sm capitalize">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <StatusDot ok={p.configured} />
                        <span className={`text-xs ${p.configured ? 'text-green-400' : 'text-slate-500'}`}>
                          {p.configured ? (aiStatus.activeProvider === p.name ? 'Active' : 'Configured') : 'Not set'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm py-2">Loading…</p>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                Control Plane
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Dev Studio', href: '/admin/dev-studio', icon: Terminal },
                  { label: 'System', href: '/admin/system', icon: Activity },
                  { label: 'Snapshots', href: '/admin/snapshots', icon: DatabaseBackup },
                  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileSearch },
                  { label: 'Impersonate', href: '/admin/impersonate', icon: Users },
                  { label: 'Governance', href: '/admin/governance', icon: Shield },
                ].map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Middle col: Recent audit logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <SectionHeader title="Recent Audit Events" href="/admin/audit-logs" icon={FileSearch} />
            {auditLogs.length > 0 ? (
              <div className="space-y-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-300 text-xs font-medium truncate flex-1">{log.action}</p>
                      <span className="text-slate-500 text-xs flex-shrink-0">{formatRelative(log.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileSearch className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No recent audit events</p>
              </div>
            )}
          </div>

          {/* Right col: Snapshots + automation */}
          <div className="space-y-4">

            {/* Recent snapshots */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <SectionHeader title="Recent Snapshots" href="/admin/snapshots" icon={DatabaseBackup} />
              {snapshots.length > 0 ? (
                <div className="space-y-2">
                  {snapshots.map((snap) => (
                    <div key={snap.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-800 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${SNAPSHOT_COLORS[snap.snapshot_type] ?? 'text-slate-400'}`}>
                          {snap.snapshot_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-slate-400 text-xs truncate">{snap.label}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {snap.rolled_back && (
                          <span className="text-xs text-slate-500">rolled back</span>
                        )}
                        <p className="text-slate-500 text-xs">{formatRelative(snap.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm py-4 text-center">No snapshots yet</p>
              )}
            </div>

            {/* Automation summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <SectionHeader title="Automation" href="/admin/automation" icon={Zap} />
              <div className="space-y-2">
                {[
                  { label: 'Nudge Emails', schedule: 'Daily 9:00 AM', active: true },
                  { label: 'Missed Check-ins', schedule: 'Daily 6:00 PM', active: true },
                  { label: 'End of Day Summary', schedule: 'Daily 8:00 PM', active: true },
                ].map(({ label, schedule, active }) => (
                  <div key={label} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-slate-300 text-xs font-medium">{label}</p>
                      <p className="text-slate-500 text-xs">{schedule}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusDot ok={active} />
                      <span className="text-xs text-green-400">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending actions */}
            {counts.pendingApplications > 0 && (
              <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-300">Action Required</h2>
                </div>
                <p className="text-amber-200 text-sm">
                  {counts.pendingApplications} application{counts.pendingApplications !== 1 ? 's' : ''} pending review
                </p>
                <Link
                  href="/admin/applications"
                  className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Review applications →
                </Link>
              </div>
            )}

            {counts.pendingDocuments > 0 && (
              <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-300">Documents Pending</h2>
                </div>
                <p className="text-amber-200 text-sm">
                  {counts.pendingDocuments} document{counts.pendingDocuments !== 1 ? 's' : ''} awaiting review
                </p>
                <Link
                  href="/admin/documents"
                  className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Review documents →
                </Link>
              </div>
            )}

            {counts.pendingApplications === 0 && counts.pendingDocuments === 0 && (
              <div className="bg-green-950/30 border border-green-800 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm">No pending actions</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Live Ops Row ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">

          {/* Clock-in Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                OJT Clock-ins
                {liveOpsSummary && liveOpsSummary.activeClockIns > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-900/60 text-green-300 border border-green-800">
                    {liveOpsSummary.activeClockIns} active
                  </span>
                )}
              </h2>
              <Link href="/admin/progress" className="text-xs text-brand-blue-400 hover:text-brand-blue-300 transition-colors">
                View all →
              </Link>
            </div>
            {clockIns.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {clockIns.map((entry) => (
                  <div key={entry.id} className="py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.is_active ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <p className="text-slate-300 text-xs font-medium truncate">{entry.student_name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.is_active && entry.duration_min !== null && (
                          <span className="text-xs text-green-400">{entry.duration_min}m</span>
                        )}
                        <span className="text-slate-500 text-xs">{formatRelative(entry.clock_in_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No clock-ins in last 24h</p>
              </div>
            )}
          </div>

          {/* AI / Platform Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                System Alerts
                {liveOpsSummary && liveOpsSummary.unresolvedAlerts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-900/60 text-red-300 border border-red-800">
                    {liveOpsSummary.unresolvedAlerts} unresolved
                  </span>
                )}
              </h2>
              <Link href="/admin/monitoring" className="text-xs text-brand-blue-400 hover:text-brand-blue-300 transition-colors">
                View all →
              </Link>
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`py-2 border-b border-slate-800 last:border-0 ${!alert.resolved ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                        alert.severity === 'critical' ? 'bg-red-400' :
                        alert.severity === 'error'    ? 'bg-red-400' :
                        alert.severity === 'warning'  ? 'bg-amber-400' : 'bg-slate-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs font-medium truncate">
                          {alert.message ?? alert.event_type}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs capitalize ${
                            alert.severity === 'critical' || alert.severity === 'error' ? 'text-red-400' :
                            alert.severity === 'warning' ? 'text-amber-400' : 'text-slate-500'
                          }`}>{alert.severity}</span>
                          <span className="text-slate-600 text-xs">{alert.category}</span>
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs flex-shrink-0">{formatRelative(alert.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No alerts in last 24h</p>
              </div>
            )}
          </div>

          {/* Active Lesson Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                Lesson Activity
                {liveOpsSummary && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-900/60 text-blue-300 border border-blue-800">
                    {liveOpsSummary.lessonCompletions24h} today
                  </span>
                )}
              </h2>
              <Link href="/admin/students" className="text-xs text-brand-blue-400 hover:text-brand-blue-300 transition-colors">
                View all →
              </Link>
            </div>
            {lessonActivity.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {lessonActivity.map((entry) => (
                  <div key={entry.id} className="py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <p className="text-slate-300 text-xs font-medium truncate">{entry.student_name}</p>
                      </div>
                      <span className="text-slate-500 text-xs flex-shrink-0">{formatRelative(entry.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No completions in last 24h</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
