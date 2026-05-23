'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity, AlertTriangle, Bot, CheckCircle, Clock, Database,
  DatabaseBackup, FileSearch, RefreshCw, Server, Shield,
  Terminal, TrendingUp, Users, Zap, XCircle, Mail,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type MissionData = {
  dbConnected: boolean;
  totalUsers: number;
  totalEnrollments: number;
  pendingApplications: number;
  enrollmentsToday: number;
  emailsSentToday: number;
  emailsFailedToday: number;
  certificatesThisWeek: number;
  recentAuditLogs: { id: string; action: string; created_at: string; user_id: string }[];
  recentSnapshots: { id: string; snapshot_type: string; label: string; rolled_back: boolean; created_at: string }[];
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

export default function MissionControlClient({ data }: { data: MissionData }) {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchLiveStatus = useCallback(async () => {
    const [aiRes, sysRes] = await Promise.allSettled([
      fetch('/api/admin/ai-provider-status').then(r => r.json()),
      fetch('/api/admin/monitoring/status').then(r => r.json()),
    ]);
    if (aiRes.status === 'fulfilled') setAiStatus(aiRes.value);
    if (sysRes.status === 'fulfilled') setSysStatus(sysRes.value);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLiveStatus();
    setRefreshing(false);
  };

  const overallHealth = !data.dbConnected ? 'down'
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
          <StatCard label="Total Users" value={data.totalUsers} icon={Users} color="bg-blue-900/50 text-blue-400" href="/admin/students" />
          <StatCard label="Enrollments" value={data.totalEnrollments} icon={TrendingUp} color="bg-green-900/50 text-green-400" href="/admin/enrollments" />
          <StatCard label="Pending Applications" value={data.pendingApplications} icon={AlertTriangle} color={data.pendingApplications > 0 ? "bg-amber-900/50 text-amber-400" : "bg-slate-800 text-slate-400"} href="/admin/applications" />
          <StatCard label="Certs This Week" value={data.certificatesThisWeek} icon={Shield} color="bg-purple-900/50 text-purple-400" href="/admin/certificates" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Enrollments Today" value={data.enrollmentsToday} icon={Activity} color="bg-green-900/50 text-green-400" />
          <StatCard label="Emails Sent Today" value={data.emailsSentToday} icon={Mail} color="bg-blue-900/50 text-blue-400" />
          <StatCard label="Email Failures Today" value={data.emailsFailedToday} icon={XCircle} color={data.emailsFailedToday > 0 ? "bg-red-900/50 text-red-400" : "bg-slate-800 text-slate-400"} href="/admin/automation" />
          <StatCard label="DB Status" value={data.dbConnected ? 'Connected' : 'Error'} icon={Database} color={data.dbConnected ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"} />
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
              <SectionHeader title="AI Providers" href="/admin/ai-console" icon={Bot} />
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
                  { label: 'Command Center', href: '/admin/command-center', icon: Activity },
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
            {data.recentAuditLogs.length > 0 ? (
              <div className="space-y-1">
                {data.recentAuditLogs.map((log) => (
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
              {data.recentSnapshots.length > 0 ? (
                <div className="space-y-2">
                  {data.recentSnapshots.map((snap) => (
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
            {data.pendingApplications > 0 && (
              <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-300">Action Required</h2>
                </div>
                <p className="text-amber-200 text-sm">
                  {data.pendingApplications} application{data.pendingApplications !== 1 ? 's' : ''} pending review
                </p>
                <Link
                  href="/admin/applications"
                  className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Review applications →
                </Link>
              </div>
            )}

            {data.emailsFailedToday > 0 && (
              <div className="bg-red-950/30 border border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold text-red-300">Email Failures</h2>
                </div>
                <p className="text-red-200 text-sm">
                  {data.emailsFailedToday} email{data.emailsFailedToday !== 1 ? 's' : ''} failed today
                </p>
                <Link
                  href="/admin/automation"
                  className="mt-2 inline-block text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  View delivery log →
                </Link>
              </div>
            )}

            {data.pendingApplications === 0 && data.emailsFailedToday === 0 && (
              <div className="bg-green-950/30 border border-green-800 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm">No pending actions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
