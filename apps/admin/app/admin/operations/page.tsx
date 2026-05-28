import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Activity, AlertTriangle, CheckCircle, Clock, XCircle,
  RefreshCw, Inbox, Zap, BarChart3, ArrowRight, RotateCcw,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Operations | Admin' };

// Dead-letter replay is a client action — link to the detail page instead
// so the server component stays pure. The replay API is at:
// POST /api/admin/workflows/dead-letters/[id]/replay

function StatusDot({ status }: { status: 'ok' | 'warn' | 'fail' }) {
  if (status === 'ok') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />;
  if (status === 'warn') return <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
}

export default async function OperationsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since1h  = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [
    cronTotal,
    cronFailed,
    cronRecent,
    workflowRuns,
    workflowFailed,
    deadLetters,
    deadLettersRecent,
    stepLogs,
    openAlerts,
    criticalAlerts,
    recentCronRuns,
    recentDeadLetters,
    recentAlerts,
  ] = await Promise.allSettled([
    db.from('cron_job_runs').select('id', { count: 'exact', head: true }).gte('started_at', since24h),
    db.from('cron_job_runs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('started_at', since24h),
    db.from('cron_job_runs').select('id', { count: 'exact', head: true }).gte('started_at', since1h),
    db.from('workflow_runs').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('workflow_runs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', since24h),
    db.from('workflow_dead_letters').select('id', { count: 'exact', head: true }),
    db.from('workflow_dead_letters').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('workflow_step_logs').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('admin_alerts').select('id', { count: 'exact', head: true }).eq('resolved', false),
    db.from('admin_alerts').select('id', { count: 'exact', head: true }).eq('resolved', false).in('severity', ['critical', 'high']),
    db.from('cron_job_runs').select('id, job_name, status, started_at, duration_ms, error').order('started_at', { ascending: false }).limit(20),
    db.from('workflow_dead_letters').select('id, workflow_id, action_type, last_error, attempts, created_at').order('created_at', { ascending: false }).limit(10),
    db.from('admin_alerts').select('id, alert_type, severity, message, created_at, resolved').eq('resolved', false).order('created_at', { ascending: false }).limit(10),
  ]);

  const get = <T,>(r: PromiseSettledResult<{ data?: T; count?: number | null; error?: unknown }>, fallback: T) =>
    r.status === 'fulfilled' ? (r.value.data ?? fallback) : fallback;
  const getCount = (r: PromiseSettledResult<{ count?: number | null }>) =>
    r.status === 'fulfilled' ? (r.value.count ?? 0) : 0;

  const cronTotalCount    = getCount(cronTotal);
  const cronFailedCount   = getCount(cronFailed);
  const cronRecentCount   = getCount(cronRecent);
  const wfRunsCount       = getCount(workflowRuns);
  const wfFailedCount     = getCount(workflowFailed);
  const dlTotalCount      = getCount(deadLetters);
  const dlRecentCount     = getCount(deadLettersRecent);
  const stepLogsCount     = getCount(stepLogs);
  const openAlertsCount   = getCount(openAlerts);
  const criticalCount     = getCount(criticalAlerts);

  const cronRows    = get(recentCronRuns, [] as any[]);
  const dlRows      = get(recentDeadLetters, [] as any[]);
  const alertRows   = get(recentAlerts, [] as any[]);

  const cronHealth  = cronFailedCount === 0 ? 'ok' : cronFailedCount <= 2 ? 'warn' : 'fail';
  const wfHealth    = wfFailedCount === 0 ? 'ok' : wfFailedCount <= 3 ? 'warn' : 'fail';
  const dlHealth    = dlRecentCount === 0 ? 'ok' : dlRecentCount <= 2 ? 'warn' : 'fail';
  const alertHealth = criticalCount === 0 ? 'ok' : criticalCount <= 3 ? 'warn' : 'fail';

  const SEVERITY_STYLES: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high:     'bg-orange-100 text-orange-800',
    medium:   'bg-amber-100 text-amber-800',
    warning:  'bg-yellow-100 text-yellow-800',
    low:      'bg-slate-100 text-slate-600',
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Operations</h1>
            <p className="text-slate-400 text-sm mt-1">Cron health · Workflow engine · Dead letters · Active alerts</p>
          </div>
          <Link href="/admin/system-health" className="text-sm text-brand-blue-400 hover:text-brand-blue-300 flex items-center gap-1">
            System Health <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Status strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cron Jobs (24h)', status: cronHealth, value: `${cronTotalCount} runs · ${cronFailedCount} failed` },
            { label: 'Workflow Engine', status: wfHealth,   value: `${wfRunsCount} runs · ${wfFailedCount} failed` },
            { label: 'Dead Letters',   status: dlHealth,    value: `${dlTotalCount} total · ${dlRecentCount} new` },
            { label: 'Active Alerts',  status: alertHealth, value: `${openAlertsCount} open · ${criticalCount} critical` },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={s.status} />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-white text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Cron runs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Recent Cron Runs</h2>
            <span className="ml-auto text-xs text-slate-500">{cronRecentCount} in last hour</span>
          </div>
          {cronRows.length === 0 ? (
            <p className="px-5 py-6 text-slate-500 text-sm">No cron runs recorded yet. Apply migration 20260705000001 to enable.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {cronRows.map((r: any) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  {r.status === 'success'
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    : r.status === 'failed'
                    ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    : <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />}
                  <span className="text-white font-mono">{r.job_name}</span>
                  <span className="text-slate-500 ml-auto">{r.duration_ms != null ? `${r.duration_ms}ms` : '—'}</span>
                  <span className="text-slate-600 text-xs">{new Date(r.started_at).toLocaleTimeString()}</span>
                  {r.error && <span className="text-red-400 text-xs truncate max-w-xs">{r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dead letters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Workflow Dead Letters</h2>
            <span className="ml-auto text-xs text-slate-500">{dlTotalCount} total</span>
          </div>
          {dlRows.length === 0 ? (
            <p className="px-5 py-6 text-slate-500 text-sm">
              {dlTotalCount === 0 ? 'No dead letters — all workflow steps completing successfully.' : 'No recent dead letters.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {dlRows.map((r: any) => (
                <div key={r.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-mono">{r.action_type ?? 'unknown'}</span>
                    <span className="text-slate-500 text-xs ml-auto">{r.attempts} attempts</span>
                    <span className="text-slate-600 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.workflow_id && (
                      <Link
                        href={`/admin/workflows/${r.workflow_id}`}
                        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        title="Replay via workflow page"
                      >
                        <RotateCcw className="w-3 h-3" /> Replay
                      </Link>
                    )}
                  </div>
                  {r.last_error && (
                    <p className="mt-1 ml-7 text-red-400 text-xs truncate">{r.last_error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow step stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Workflow Runs (24h)',  value: wfRunsCount,   icon: Zap },
            { label: 'Step Logs (24h)',      value: stepLogsCount, icon: BarChart3 },
            { label: 'Failed Runs (24h)',    value: wfFailedCount, icon: XCircle },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <s.icon className="w-5 h-5 text-slate-500 mb-3" />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Active Alerts</h2>
            <span className="ml-auto text-xs text-slate-500">{openAlertsCount} unresolved</span>
            <Link href="/admin/monitoring" className="text-xs text-brand-blue-400 hover:text-brand-blue-300 ml-2">
              View all →
            </Link>
          </div>
          {alertRows.length === 0 ? (
            <p className="px-5 py-6 text-slate-500 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> No active alerts.
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {alertRows.map((a: any) => (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3 text-sm">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${SEVERITY_STYLES[a.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                    {a.severity}
                  </span>
                  <span className="text-slate-300 flex-1">{a.message}</span>
                  <span className="text-slate-600 text-xs shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
