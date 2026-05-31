'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  XCircle,
} from 'lucide-react';

type WorkflowKey = 'deploy-lms' | 'deploy-admin' | 'deploy-studio' | 'ci-cd' | 'lint' | string;

interface WorkflowButton {
  key: WorkflowKey;
  label: string;
  description: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  workflow?: string;
  createdAt?: string;
  jobs?: { id: number; name: string; status: string; conclusion: string | null; url: string }[];
}

interface DispatchResult {
  ok: boolean;
  workflow: string;
  method: string;
  runId: number | null;
  runUrl: string;
  status: string;
  error?: string;
}

const DEFAULT_WORKFLOWS: WorkflowButton[] = [
  { key: 'deploy-lms', label: 'Deploy Website', description: 'Build and push the public LMS service to AWS ECS' },
  { key: 'deploy-admin', label: 'Deploy Admin', description: 'Build and push the admin dashboard to AWS ECS' },
  { key: 'deploy-studio', label: 'Deploy Studio', description: 'Build and push the studio shell service to AWS ECS' },
  { key: 'ci-cd', label: 'Run CI', description: 'Full validation pipeline (ci-cd.yml)' },
  { key: 'lint', label: 'Run Lint', description: 'ESLint check workflow' },
];

function statusTone(status?: string, conclusion?: string | null) {
  if (conclusion === 'success')
    return { className: 'text-brand-green-700', Icon: CheckCircle2, label: 'Passed', spin: false };
  if (conclusion === 'failure' || conclusion === 'cancelled')
    return { className: 'text-red-600', Icon: XCircle, label: conclusion ?? 'failed', spin: false };
  if (status === 'queued' || status === 'in_progress')
    return { className: 'text-amber-600', Icon: Loader2, label: status.replace('_', ' '), spin: true };
  return { className: 'text-slate-500', Icon: Activity, label: status || 'ready', spin: false };
}

export default function DeployPanel({
  workflowButtons,
  variant = 'dark',
}: {
  workflowButtons?: WorkflowButton[];
  variant?: 'dark' | 'admin';
}) {
  const admin = variant === 'admin';
  const workflows = useMemo(
    () =>
      (workflowButtons?.length ? workflowButtons : DEFAULT_WORKFLOWS).map((w) =>
        w.key === 'ci' ? { ...w, key: 'ci-cd' as WorkflowKey } : w,
      ),
    [workflowButtons],
  );
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DispatchResult | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch('/api/devstudio/shell?action=recent_runs&per_page=8');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRecentRuns(data.runs ?? []);
    } catch {
      setRecentRuns([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  async function dispatchWorkflow(workflow: WorkflowButton, rerun = false) {
    if (!rerun && workflow.key.startsWith('deploy-') && confirmKey !== workflow.key) {
      setConfirmKey(workflow.key);
      return;
    }

    setConfirmKey(null);
    setRunningKey(workflow.key);
    setError(null);
    setRun(null);

    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflow.key }),
      });
      const data = (await res.json().catch(() => ({}))) as DispatchResult;
      if (!res.ok || data.error) throw new Error(data.error || `Dispatch failed with HTTP ${res.status}`);
      setLastResult(data);
      void loadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start workflow');
    } finally {
      setRunningKey(null);
    }
  }

  async function refreshRun() {
    if (!lastResult?.runId) return;
    try {
      const res = await fetch(`/api/devstudio/shell?run_id=${lastResult.runId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status failed with HTTP ${res.status}`);
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh workflow status');
    }
  }

  useEffect(() => {
    if (!lastResult?.runId) return;
    refreshRun();
    const timer = window.setInterval(refreshRun, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult?.runId]);

  const activeStatus = statusTone(run?.status ?? lastResult?.status, run?.conclusion);
  const ActiveIcon = activeStatus.Icon;

  const shellClass = admin
    ? 'flex h-full flex-col overflow-hidden bg-slate-50'
    : 'flex h-full flex-col overflow-hidden';
  const headerClass = admin
    ? 'flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3'
    : 'flex-shrink-0 border-b px-4 py-3';
  const headerStyle = admin ? undefined : { background: '#252526', borderColor: '#3c3c3c' };
  const titleClass = admin ? 'text-sm font-semibold text-slate-900' : 'text-sm font-semibold text-white';
  const subClass = admin ? 'mt-1 text-xs text-slate-500' : 'mt-1 text-[11px]';
  const subStyle = admin ? undefined : { color: '#858585' };

  return (
    <div className={shellClass} style={admin ? undefined : { background: '#1e1e1e' }}>
      <div className={headerClass} style={headerStyle}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Rocket className={`h-4 w-4 ${admin ? 'text-brand-blue-600' : ''}`} style={admin ? undefined : { color: '#4ec9b0' }} />
              <h2 className={titleClass}>Deploy to AWS</h2>
            </div>
            <p className={subClass} style={subStyle}>
              Dispatches real GitHub Actions workflows (requires GITHUB_TOKEN on admin ECS).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              refreshRun();
              void loadRecent();
            }}
            disabled={!lastResult?.runId && recentLoading}
            className={
              admin
                ? 'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 disabled:opacity-40'
                : 'inline-flex h-8 items-center gap-1.5 rounded border px-2 text-[11px] disabled:opacity-40'
            }
            style={admin ? undefined : { borderColor: '#3c3c3c', color: '#cccccc' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recentLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              admin ? 'border-red-200 bg-red-50 text-red-800' : ''
            }`}
            style={
              admin
                ? undefined
                : { borderColor: '#7f1d1d', background: 'rgba(127,29,29,0.22)', color: '#fecaca' }
            }
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => {
            const pending = runningKey === workflow.key;
            const needsConfirm = confirmKey === workflow.key;
            return (
              <div
                key={workflow.key}
                className={`rounded-xl border p-3 ${admin ? 'border-slate-200 bg-white' : 'rounded-md'}`}
                style={
                  admin
                    ? needsConfirm
                      ? { borderColor: '#f59e0b' }
                      : undefined
                    : { borderColor: needsConfirm ? '#f59e0b' : '#3c3c3c', background: '#252526' }
                }
              >
                <div className="mb-3 flex min-h-12 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${admin ? 'text-slate-900' : 'text-white'}`}>
                      {workflow.label}
                    </p>
                    <p className={`mt-1 text-[11px] leading-relaxed ${admin ? 'text-slate-500' : ''}`} style={admin ? undefined : { color: '#9ca3af' }}>
                      {workflow.description}
                    </p>
                  </div>
                </div>

                {needsConfirm && (
                  <p
                    className={`mb-2 rounded-lg border px-2 py-1.5 text-[11px] ${
                      admin ? 'border-amber-200 bg-amber-50 text-amber-900' : ''
                    }`}
                    style={
                      admin
                        ? undefined
                        : { borderColor: '#f59e0b', color: '#fcd34d', background: 'rgba(245,158,11,0.08)' }
                    }
                  >
                    Click again to deploy production.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => dispatchWorkflow(workflow)}
                  disabled={pending}
                  className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                    admin
                      ? needsConfirm
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                      : ''
                  }`}
                  style={
                    admin
                      ? undefined
                      : { background: needsConfirm ? '#f59e0b' : '#0078d4', color: needsConfirm ? '#111827' : '#ffffff' }
                  }
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  {needsConfirm ? 'Confirm deploy' : 'Run workflow'}
                </button>
              </div>
            );
          })}
        </div>

        {recentRuns.length > 0 && (
          <section className={`mt-6 ${admin ? 'rounded-xl border border-slate-200 bg-white' : 'rounded-md border'}`} style={admin ? undefined : { borderColor: '#3c3c3c', background: '#252526' }}>
            <div className={`border-b px-3 py-2 ${admin ? 'border-slate-200' : ''}`} style={admin ? undefined : { borderColor: '#3c3c3c' }}>
              <h3 className={`text-xs font-semibold ${admin ? 'text-slate-800' : 'text-white'}`}>Recent workflow runs</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentRuns.map((item) => {
                const tone = statusTone(item.status, item.conclusion);
                const Icon = tone.Icon;
                const failed = item.conclusion === 'failure';
                const wf = workflows.find((w) => item.workflow?.includes(w.key.replace('.yml', '')));
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <a href={item.url} target="_blank" rel="noreferrer" className={`font-medium hover:underline ${admin ? 'text-brand-blue-700' : ''}`} style={admin ? undefined : { color: '#4ec9b0' }}>
                        {item.name}
                      </a>
                      {item.createdAt && (
                        <p className={`text-[10px] ${admin ? 'text-slate-400' : ''}`} style={admin ? undefined : { color: '#858585' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 ${tone.className}`}>
                        <Icon className={`h-3.5 w-3.5 ${tone.spin ? 'animate-spin' : ''}`} />
                        {tone.label}
                      </span>
                      {failed && wf && (
                        <button
                          type="button"
                          onClick={() => dispatchWorkflow(wf, true)}
                          disabled={runningKey === wf.key}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Re-run
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {(lastResult || run) && (
          <section
            className={`mt-4 ${admin ? 'rounded-xl border border-slate-200 bg-white' : 'rounded-md border'}`}
            style={admin ? undefined : { borderColor: '#3c3c3c', background: '#252526' }}
          >
            <div
              className={`flex items-center justify-between gap-3 border-b px-3 py-2 ${admin ? 'border-slate-200' : ''}`}
              style={admin ? undefined : { borderColor: '#3c3c3c' }}
            >
              <div className="flex items-center gap-2">
                <ActiveIcon className={`h-4 w-4 ${activeStatus.spin ? 'animate-spin' : ''} ${admin ? activeStatus.className : ''}`} style={admin ? undefined : { color: activeStatus.className }} />
                <span className={`text-xs font-semibold ${admin ? 'text-slate-900' : 'text-white'}`}>{run?.name ?? lastResult?.workflow}</span>
              </div>
              {(run?.url || lastResult?.runUrl) && (
                <a
                  href={run?.url || lastResult?.runUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 text-[11px] ${admin ? 'text-brand-blue-600' : ''}`}
                  style={admin ? undefined : { color: '#4ec9b0' }}
                >
                  <ExternalLink className="h-3 w-3" />
                  GitHub Actions
                </a>
              )}
            </div>

            {run?.jobs?.length ? (
              <div className={`divide-y ${admin ? 'divide-slate-100' : ''}`} style={admin ? undefined : { borderColor: '#3c3c3c' }}>
                {run.jobs.map((job) => {
                  const tone = statusTone(job.status, job.conclusion);
                  const JobIcon = tone.Icon;
                  return (
                    <a
                      key={job.id}
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-between gap-3 px-3 py-2 text-xs ${admin ? 'text-slate-700 hover:bg-slate-50' : ''}`}
                      style={admin ? undefined : { color: '#cccccc', borderColor: '#3c3c3c' }}
                    >
                      <span className="truncate">{job.name}</span>
                      <span className={`inline-flex items-center gap-1.5 ${tone.className}`}>
                        <JobIcon className={`h-3.5 w-3.5 ${tone.spin ? 'animate-spin' : ''}`} />
                        {tone.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className={`px-3 py-3 text-[11px] ${admin ? 'text-slate-500' : ''}`} style={admin ? undefined : { color: '#858585' }}>
                Workflow queued. Job details appear when GitHub reports the run.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
