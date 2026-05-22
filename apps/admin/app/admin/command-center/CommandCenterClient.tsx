'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, Zap,
  Database, Shield, GitBranch, Play, RefreshCw, Brain, Map,
  TrendingUp, Users, BookOpen, Server,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface PlatformEvent {
  id: string;
  event_type: string;
  category: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

interface PlatformState {
  timestamp: string;
  deployment: {
    environment: string;
    ai_provider: string;
    github_connected: boolean;
    stripe_connected: boolean;
    resend_connected: boolean;
  };
  platform: {
    active_students: number | null;
    total_applications: number | null;
    pending_applications: number | null;
    total_enrollments: number | null;
    published_programs: number | null;
    certificates_issued: number | null;
  };
  systems: Array<{ id: string; name: string; status: string }>;
  debt: {
    total_items: number;
    by_severity: { high: number; medium: number; low: number };
    top_issues: string[];
  };
}

interface QaLine {
  text: string;
  ts: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  if (s === 'critical') return 'text-red-600 bg-red-50 border-red-200';
  if (s === 'error')    return 'text-red-500 bg-red-50 border-red-100';
  if (s === 'warning')  return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function severityIcon(s: string) {
  if (s === 'critical' || s === 'error') return <XCircle className="w-3.5 h-3.5 shrink-0" />;
  if (s === 'warning') return <AlertTriangle className="w-3.5 h-3.5 shrink-0" />;
  return <CheckCircle className="w-3.5 h-3.5 shrink-0" />;
}

function stripAnsi(str: string) {
  let out = '';
  let i = 0;
  while (i < str.length) {
    const ch = str.charCodeAt(i);
    if (ch === 27 && str[i + 1] === '[') {
      i += 2;
      while (i < str.length && str[i] !== 'm') i++;
      if (i < str.length) i++;
      continue;
    }
    out += str[i];
    i++;
  }
  return out;
}

function qaLineColor(line: string) {
  const s = stripAnsi(line);
  if (s.startsWith('✓')) return 'text-green-600';
  if (s.startsWith('✗')) return 'text-red-500';
  if (s.startsWith('⚠')) return 'text-amber-500';
  if (s.startsWith('   ')) return 'text-slate-500';
  if (s.startsWith('\n') || /^\d\./.test(s.trim())) return 'text-slate-900 font-semibold mt-2';
  return 'text-slate-700';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CommandCenterClient() {
  const [state, setState] = useState<PlatformState | null>(null);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [qaLines, setQaLines] = useState<QaLine[]>([]);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaScope, setQaScope] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const qaRef = useRef<HTMLDivElement>(null);

  const fetchState = useCallback(async () => {
    try {
      const [stateRes, eventsRes] = await Promise.all([
        fetch('/api/devstudio/platform-state'),
        fetch('/api/devstudio/events?limit=30'),
      ]);
      if (stateRes.ok) setState(await stateRes.json());
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events ?? []);
      }
      setLastRefresh(new Date());
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000);
    return () => clearInterval(interval);
  }, [fetchState]);

  useEffect(() => {
    if (qaRef.current) qaRef.current.scrollTop = qaRef.current.scrollHeight;
  }, [qaLines]);

  const runQaScan = useCallback(async () => {
    setQaRunning(true);
    setQaLines([]);
    try {
      const res = await fetch(`/api/devstudio/qa-scan?scope=${qaScope}`);
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const { text } = JSON.parse(payload);
            if (text) setQaLines(prev => [...prev, { text, ts: Date.now() }]);
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setQaLines(prev => [...prev, { text: `Error: ${err instanceof Error ? err.message : 'failed'}`, ts: Date.now() }]);
    } finally {
      setQaRunning(false);
      fetchState(); // refresh state after QA
    }
  }, [qaScope, fetchState]);

  const stat = state?.platform;
  const dep  = state?.deployment;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-brand-blue-600" />
              Command Center
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live platform observability · Last refresh: {timeAgo(lastRefresh.toISOString())}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/ai-console" className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Brain className="w-4 h-4" /> AI Console
            </Link>
            <button
              onClick={fetchState}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Platform state strip */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : stat && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Students',     value: stat.active_students,     icon: Users,     color: 'text-blue-600' },
              { label: 'Enrollments',  value: stat.total_enrollments,   icon: BookOpen,  color: 'text-green-600' },
              { label: 'Pending Apps', value: stat.pending_applications, icon: Clock,    color: stat.pending_applications && stat.pending_applications > 0 ? 'text-amber-600' : 'text-slate-600' },
              { label: 'Programs',     value: stat.published_programs,  icon: Map,       color: 'text-slate-600' },
              { label: 'Certificates', value: stat.certificates_issued, icon: Shield,    color: 'text-purple-600' },
              { label: 'Debt Items',   value: state?.debt?.total_items, icon: AlertTriangle, color: state?.debt?.by_severity?.high ? 'text-red-500' : 'text-slate-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-bold ${color}`}>
                  {value ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Event feed + System status */}
          <div className="lg:col-span-2 space-y-6">

            {/* System status */}
            {state?.systems && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" /> System Status
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {state.systems.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        s.status === 'active' ? 'bg-green-400' :
                        s.status === 'partial' ? 'bg-amber-400' : 'bg-slate-300'
                      }`} />
                      <span className="text-slate-700 truncate">{s.name.split(' ')[0]}</span>
                      <span className={`ml-auto text-xs ${
                        s.status === 'active' ? 'text-green-600' :
                        s.status === 'partial' ? 'text-amber-600' : 'text-slate-400'
                      }`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deployment health */}
            {dep && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-400" /> Deployment Health
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'Environment', value: dep.environment, ok: true },
                    { label: 'AI Provider',  value: dep.ai_provider, ok: dep.ai_provider !== 'none' },
                    { label: 'GitHub',       value: dep.github_connected ? 'connected' : 'not set', ok: dep.github_connected },
                    { label: 'Stripe',       value: dep.stripe_connected ? 'connected' : 'not set', ok: dep.stripe_connected },
                    { label: 'Email',        value: dep.resend_connected ? 'connected' : 'not set', ok: dep.resend_connected },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-medium ${ok ? 'text-green-600' : 'text-amber-600'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live event feed */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" /> Live Event Feed
                <span className="ml-auto text-xs text-slate-400 font-normal">Last 30 events</span>
              </h2>
              {events.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No events yet — apply the migration to enable the event bus</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {events.map(e => (
                    <div key={e.id} className={`flex items-start gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${severityColor(e.severity)}`}>
                      {severityIcon(e.severity)}
                      <div className="flex-1 min-w-0">
                        <span className="font-mono font-medium">{e.event_type}</span>
                        {e.message && <span className="ml-2 text-slate-500">{e.message}</span>}
                      </div>
                      <span className="shrink-0 text-slate-400">{timeAgo(e.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: QA Scanner + Platform debt */}
          <div className="space-y-6">

            {/* Autonomous QA Scanner */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" /> Autonomous QA Scanner
              </h2>
              <div className="flex gap-2 mb-3">
                <select
                  value={qaScope}
                  onChange={e => setQaScope(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                  disabled={qaRunning}
                >
                  <option value="all">Full scan</option>
                  <option value="routes">Routes only</option>
                  <option value="auth">Auth gaps only</option>
                  <option value="api">API health only</option>
                  <option value="db">DB integrity only</option>
                  <option value="programs">Programs only</option>
                  <option value="env">Env vars only</option>
                </select>
                <button
                  onClick={runQaScan}
                  disabled={qaRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {qaRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {qaRunning ? 'Running…' : 'Run QA'}
                </button>
              </div>
              <div
                ref={qaRef}
                className="bg-slate-950 rounded-lg p-3 font-mono text-xs leading-relaxed h-64 overflow-y-auto"
              >
                {qaLines.length === 0 ? (
                  <span className="text-slate-600">Run a QA scan to check platform health…</span>
                ) : (
                  qaLines.map((l, i) => (
                    <div key={i} className={qaLineColor(l.text)}>
                      {stripAnsi(l.text) || '\u00a0'}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Platform debt */}
            {state?.debt && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-400" /> Platform Debt
                </h2>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'High',   count: state.debt.by_severity.high,   color: 'text-red-600 bg-red-50' },
                    { label: 'Medium', count: state.debt.by_severity.medium, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Low',    count: state.debt.by_severity.low,    color: 'text-slate-600 bg-slate-50' },
                  ].map(({ label, count, color }) => (
                    <div key={label} className={`rounded-lg p-2 text-center ${color}`}>
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs">{label}</div>
                    </div>
                  ))}
                </div>
                {state.debt.top_issues.length > 0 && (
                  <div className="space-y-1">
                    {state.debt.top_issues.map(issue => (
                      <div key={issue} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 font-mono">
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/admin/ai-console" className="mt-3 block text-xs text-center text-brand-blue-600 hover:underline">
                  Ask AI to resolve →
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h2>
              <div className="space-y-1.5">
                {[
                  { label: 'AI Console',      href: '/admin/ai-console',    icon: Brain },
                  { label: 'Monitoring',       href: '/admin/monitoring',    icon: TrendingUp },
                  { label: 'System Health',    href: '/admin/system-health', icon: Server },
                  { label: 'Dev Studio',       href: '/admin/dev-studio',    icon: Database },
                  { label: 'Audit Logs',       href: '/admin/audit-logs',    icon: Shield },
                  { label: 'Migrations',       href: '/admin/dev-studio',    icon: GitBranch },
                ].map(({ label, href, icon: Icon }) => (
                  <Link key={href + label} href={href} className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand-blue-600 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
