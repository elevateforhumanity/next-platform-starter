'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  Terminal,
  XCircle,
} from 'lucide-react';
import type { CommandCenterSnapshot } from '@/lib/devstudio/os/types';

interface AgentRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  capabilities: unknown;
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  requires_approval: boolean;
  risk_tags: string[];
  created_at: string;
}

const BUILD_KINDS = ['lint', 'typecheck', 'test', 'build'] as const;

export default function CommandCenterPanel() {
  const [snapshot, setSnapshot] = useState<CommandCenterSnapshot | null>(null);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('ai-developer');
  const [repoQuery, setRepoQuery] = useState('');
  const [repoResults, setRepoResults] = useState<Array<{ repo_path: string; language: string | null }>>([]);
  const [indexing, setIndexing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wfRes, agentsRes, tasksRes] = await Promise.all([
        fetch('/api/devstudio/workflows'),
        fetch('/api/devstudio/agents'),
        fetch('/api/devstudio/tasks?limit=15'),
      ]);

      const wfData = await wfRes.json().catch(() => ({}));
      const agentsData = await agentsRes.json().catch(() => ({}));
      const tasksData = await tasksRes.json().catch(() => ({}));

      if (!wfRes.ok && wfRes.status !== 503) {
        throw new Error((wfData as { error?: string }).error ?? 'Failed to load command center');
      }

      setSnapshot((wfData as { snapshot?: CommandCenterSnapshot }).snapshot ?? null);
      setAgents((agentsData as { agents?: AgentRow[] }).agents ?? []);
      setTasks((tasksData as { tasks?: TaskRow[] }).tasks ?? []);

      if (wfRes.status === 503) {
        setError((wfData as { error?: string }).error ?? 'OS tables not applied yet');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    setActionId('create');
    try {
      const res = await fetch('/api/devstudio/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, agentSlug: selectedAgent, command: title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setNewTaskTitle('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create task failed');
    } finally {
      setActionId(null);
    }
  }

  async function approveTask(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/devstudio/tasks/${id}/approve`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setActionId(null);
    }
  }

  async function triggerBuild(kind: (typeof BUILD_KINDS)[number]) {
    setActionId(`build-${kind}`);
    try {
      const res = await fetch('/api/devstudio/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Build trigger failed');
    } finally {
      setActionId(null);
    }
  }

  async function indexRepo() {
    setIndexing(true);
    setError(null);
    try {
      const res = await fetch('/api/devstudio/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'index-repo', maxFiles: 300 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      await searchRepo(repoQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Index failed');
    } finally {
      setIndexing(false);
    }
  }

  async function searchRepo(q: string) {
    setRepoQuery(q);
    try {
      const res = await fetch(`/api/devstudio/workflows?view=repo-search&q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRepoResults((data as { results?: typeof repoResults }).results ?? []);
      }
    } catch {
      setRepoResults([]);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-[#858585]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Loading command center…</span>
import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle, Rocket, Server, XCircle } from 'lucide-react';

interface CommandCenterData {
  activeTasks: number;
  failedTasks: number;
  latestDeployments: { service: string; status: string }[];
  activeAgents: number;
  recentErrors: number;
  health: {
    website: boolean;
    lms: boolean;
    database: boolean;
  };
}

export default function CommandCenterPanel() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    setLoading(true);
    try {
      const [tasksRes, buildsRes, agentsRes, auditRes] = await Promise.all([
        fetch('/api/devstudio/tasks').then((r) => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/devstudio/builds').then((r) => r.json()).catch(() => ({ builds: [] })),
        fetch('/api/devstudio/agents').then((r) => r.json()).catch(() => ({ agents: [] })),
        fetch('/api/devstudio/audit?limit=20').then((r) => r.json()).catch(() => ({ logs: [] })),
      ]);

      const tasks = tasksRes.tasks ?? [];
      const builds = buildsRes.builds ?? [];
      const agents = agentsRes.agents ?? [];
      const logs = auditRes.logs ?? [];

      setData({
        activeTasks: tasks.filter((t: { status: string }) => ['pending', 'running', 'awaiting_approval'].includes(t.status)).length,
        failedTasks: tasks.filter((t: { status: string }) => t.status === 'failed').length,
        latestDeployments: builds.slice(0, 3).map((b: { service: string; status: string }) => ({ service: b.service, status: b.status })),
        activeAgents: agents.filter((a: { status: string }) => a.status === 'active').length,
        recentErrors: logs.filter((l: { action: string }) => l.action.includes('failed') || l.action.includes('error')).length,
        health: {
          website: true,
          lms: true,
          database: true,
        },
      });
    } catch {
      // Silently degrade
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  if (loading || !data) {
    return (
      <div className="p-4" style={{ background: '#1e1e1e', color: '#858585' }}>
        <p className="text-xs">Loading command center...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#4ec9b0]" />
          <h2 className="text-sm font-semibold text-white">Command Center</h2>
          <span className="text-[10px] text-[#858585]">AI Dev Studio OS</span>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-7 items-center gap-1 rounded border border-[#3c3c3c] px-2 text-[11px]"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active tasks" value={snapshot?.activeTasks ?? 0} icon={Terminal} />
          <StatCard label="Awaiting approval" value={snapshot?.awaitingApproval ?? 0} icon={Shield} accent="#f97316" />
          <StatCard label="Failed tasks" value={snapshot?.failedTasks ?? 0} icon={XCircle} accent="#f87171" />
          <StatCard label="Busy agents" value={snapshot?.activeAgents ?? 0} icon={Bot} accent="#4ec9b0" />
        </div>

        <section className="mb-4 rounded border border-[#3c3c3c] bg-[#252526] p-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#858585]">System health</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <HealthPill label="Website" ok={snapshot?.health.website} />
            <HealthPill label="LMS" ok={snapshot?.health.lms} />
            <HealthPill label="Database" ok={snapshot?.health.database} />
          </div>
          {(snapshot?.integrationPending.length ?? 0) > 0 && (
            <p className="mt-2 text-[10px] text-[#858585]">
              Pending: {snapshot?.integrationPending.join(', ')}
            </p>
          )}
        </section>

        <section className="mb-4 rounded border border-[#3c3c3c] bg-[#252526] p-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#858585]">
            <Rocket className="h-3 w-3" />
            Build &amp; verify
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {BUILD_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={actionId === `build-${kind}`}
                onClick={() => void triggerBuild(kind)}
                className="rounded border border-[#555] bg-[#3c3c3c] px-2.5 py-1 text-[11px] disabled:opacity-50"
              >
                {actionId === `build-${kind}` ? <Loader2 className="inline h-3 w-3 animate-spin" /> : null}
                {kind}
              </button>
            ))}
          </div>
          {snapshot?.buildStatus.lastBuild && (
            <p className="mt-2 font-mono text-[10px] text-[#858585]">
              Last: {snapshot.buildStatus.lastBuild.kind} — {snapshot.buildStatus.lastBuild.status}
            </p>
          )}
        </section>

        <section className="mb-4 rounded border border-[#3c3c3c] bg-[#252526] p-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#858585]">
            <GitBranch className="h-3 w-3" />
            New task
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="h-9 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 text-[11px]"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Describe what the agent should do…"
              className="h-9 min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 text-[11px] outline-none"
            />
            <button
              type="button"
              disabled={!newTaskTitle.trim() || actionId === 'create'}
              onClick={() => void createTask()}
              className="inline-flex h-9 items-center gap-1 rounded bg-[#0078d4] px-3 text-[11px] text-white disabled:opacity-50"
            >
              {actionId === 'create' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Queue
            </button>
          </div>
        </section>

        <section className="mb-4 rounded border border-[#3c3c3c] bg-[#252526] p-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#858585]">Recent tasks</h3>
          {tasks.length === 0 ?
            <p className="text-[11px] text-[#555]">No tasks yet.</p>
          : <ul className="space-y-1">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#2d2d2d] px-2 py-1.5 text-[11px]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{task.title}</div>
                    <div className="text-[#858585]">{task.status}</div>
                  </div>
                  {task.status === 'awaiting_approval' && (
                    <button
                      type="button"
                      disabled={actionId === task.id}
                      onClick={() => void approveTask(task.id)}
                      className="rounded bg-[#f97316] px-2 py-1 text-[10px] font-semibold text-white"
                    >
                      Approve
                    </button>
                  )}
                </li>
              ))}
            </ul>
          }
        </section>

        <section className="mb-4 rounded border border-[#3c3c3c] bg-[#252526] p-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#858585]">
            <Database className="h-3 w-3" />
            Repository index
          </h3>
          <div className="mb-2 flex gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2">
              <Search className="h-3.5 w-3.5 text-[#858585]" />
              <input
                value={repoQuery}
                onChange={(e) => void searchRepo(e.target.value)}
                placeholder="Search paths (auth, supabase, api)…"
                className="h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none"
              />
            </div>
            <button
              type="button"
              disabled={indexing}
              onClick={() => void indexRepo()}
              className="shrink-0 rounded bg-[#094771] px-2.5 py-1 text-[11px] text-white disabled:opacity-50"
            >
              {indexing ? 'Indexing…' : 'Re-index'}
            </button>
          </div>
          <ul className="max-h-40 space-y-0.5 overflow-y-auto font-mono text-[10px] text-[#858585]">
            {repoResults.map((r) => (
              <li key={r.repo_path} className="truncate">
                {r.repo_path}
                {r.language ? ` · ${r.language}` : ''}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-[#3c3c3c] bg-[#252526] p-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#858585]">AI agents</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded border border-[#2d2d2d] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-white">{agent.name}</span>
                  <span className="text-[10px] text-[#4ec9b0]">{agent.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[10px] text-[#858585]">{agent.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = '#0078d4',
}: {
  label: string;
  value: number;
  icon: React.ElementType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="rounded border border-[#3c3c3c] bg-[#252526] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-[#858585]">{label}</span>
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
      </div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function HealthPill({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded border border-[#2d2d2d] px-2 py-1.5 text-[11px]">
      {ok ?
        <CheckCircle2 className="h-3.5 w-3.5 text-[#4ec9b0]" />
      : <XCircle className="h-3.5 w-3.5 text-[#f87171]" />}
      <span>{label}</span>
    <div className="p-4 space-y-3" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4" style={{ color: '#007acc' }} />
        <h3 className="text-sm font-bold" style={{ color: '#cccccc' }}>Command Center</h3>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded border p-2 text-center" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-lg font-bold" style={{ color: data.activeTasks > 0 ? '#fbbf24' : '#4ade80' }}>{data.activeTasks}</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>Active Tasks</p>
        </div>
        <div className="rounded border p-2 text-center" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-lg font-bold" style={{ color: data.failedTasks > 0 ? '#f87171' : '#4ade80' }}>{data.failedTasks}</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>Failed</p>
        </div>
        <div className="rounded border p-2 text-center" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-lg font-bold" style={{ color: '#60a5fa' }}>{data.activeAgents}</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>Agents Active</p>
        </div>
      </div>

      {/* Health */}
      <div className="rounded border p-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
        <p className="text-[10px] font-semibold mb-2" style={{ color: '#858585' }}>SERVICE HEALTH</p>
        <div className="flex gap-3">
          {[
            { label: 'Website', ok: data.health.website },
            { label: 'LMS', ok: data.health.lms },
            { label: 'Database', ok: data.health.database },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              {s.ok ? <CheckCircle className="w-3 h-3" style={{ color: '#4ade80' }} /> : <XCircle className="w-3 h-3" style={{ color: '#f87171' }} />}
              <span className="text-[10px]" style={{ color: s.ok ? '#4ade80' : '#f87171' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Deployments */}
      {data.latestDeployments.length > 0 && (
        <div className="rounded border p-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-[10px] font-semibold mb-2" style={{ color: '#858585' }}>LATEST DEPLOYS</p>
          {data.latestDeployments.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Rocket className="w-3 h-3" style={{ color: '#858585' }} />
                <span className="text-xs" style={{ color: '#cccccc' }}>{d.service}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                background: d.status === 'success' ? '#1a3a1a' : d.status === 'failed' ? '#3a1a1a' : '#2a2a00',
                color: d.status === 'success' ? '#4ade80' : d.status === 'failed' ? '#f87171' : '#fbbf24',
              }}>{d.status}</span>
            </div>
          ))}
        </div>
      )}

      {data.recentErrors > 0 && (
        <div className="flex items-center gap-2 rounded border p-2" style={{ background: '#3a1a1a', borderColor: '#5a2a2a' }}>
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
          <span className="text-xs" style={{ color: '#f87171' }}>{data.recentErrors} recent audit errors</span>
        </div>
      )}
    </div>
  );
}
