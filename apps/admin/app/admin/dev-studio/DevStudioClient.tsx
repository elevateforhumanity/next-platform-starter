'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Sparkles, MessageSquare, Terminal, FolderOpen, Globe, Box,
  Send, Loader2, RefreshCw, ExternalLink, Save,
  ChevronRight, File, Folder, Monitor, Smartphone, Play, X, Circle,
} from 'lucide-react';

import type { default as CodeEditorType } from '@/components/dev-studio/CodeEditor';

const XTerminal         = dynamic(() => import('@/components/dev-studio/XTerminal'),         { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const AIChat            = dynamic(() => import('@/components/dev-studio/AIChat'),            { ssr: false });
const CodeEditor        = dynamic<React.ComponentProps<typeof CodeEditorType>>(
  () => import('@/components/dev-studio/CodeEditor'),
  { ssr: false },
);

type Tab = 'command' | 'terminal' | 'files' | 'website' | 'container' | 'chat';
interface FileNode { name: string; path: string; type: 'file' | 'directory'; children?: FileNode[]; }
type WorkflowKey = 'deploy-lms' | 'deploy-admin' | 'ci' | 'lint';
interface DevStudioConfig {
  quickCommands?: string[];
  workflowButtons?: { key: WorkflowKey; label: string; description: string }[];
  defaultPreviewUrl?: string;
  previewTargets?: { label: string; url: string }[];
  tabFiles?: Partial<Record<Tab, string>>;
}

const TABS: { id: Tab; Icon: React.ElementType<{ className?: string }>; label: string }[] = [
  { id: 'command',   Icon: Sparkles,      label: 'Command'   },
  { id: 'chat',      Icon: MessageSquare, label: 'AI Chat'   },
  { id: 'terminal',  Icon: Terminal,      label: 'Terminal'  },
  { id: 'files',     Icon: FolderOpen,    label: 'Explorer'  },
  { id: 'website',   Icon: Globe,         label: 'Preview'   },
  { id: 'container', Icon: Box,           label: 'Container' },
];

const DEFAULT_TAB_FILES: Record<Tab, string> = {
  command: 'command.sh', chat: 'ai-chat.md', terminal: 'terminal.sh',
  files: 'explorer', website: 'preview.html', container: 'devcontainer.json',
};

export default function DevStudioClient() {
  const searchParams = useSearchParams();
  const raw = searchParams.get('tab') as Tab | null;
  const valid: Tab[] = ['command','terminal','files','website','container','chat'];
  const init: Tab = raw && valid.includes(raw) ? raw : 'command';
  const [tab, setTab] = useState<Tab>(init);
  const [openTabs, setOpenTabs] = useState<Tab[]>([init]);
  const [studioConfig, setStudioConfig] = useState<DevStudioConfig | null>(null);
  const [configLoadError, setConfigLoadError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/devstudio/config')
      .then((r) => r.json())
      .then((d) => {
        setStudioConfig(d ?? null);
        setConfigLoadError(false);
      })
      .catch(() => {
        setStudioConfig(null);
        setConfigLoadError(true);
      });
  }, []);

  const tabFiles = { ...DEFAULT_TAB_FILES, ...(studioConfig?.tabFiles ?? {}) } as Record<Tab, string>;

  function openTab(t: Tab) {
    setTab(t);
    setOpenTabs((p) => p.includes(t) ? p : [...p, t]);
  }
  function closeTab(t: Tab, e: React.MouseEvent) {
    e.stopPropagation();
    const next = openTabs.filter((x) => x !== t);
    setOpenTabs(next.length ? next : [init]);
    if (tab === t) setTab(next[next.length - 1] ?? init);
  }

  return (
    <div className="flex flex-col text-slate-800 h-[calc(100dvh-64px)] overflow-hidden" style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", background: '#f5f5f5' }}>
      {/* Menu bar — light grey like Gitpod */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 sm:px-3 py-1 border-b border-[#ddd] text-xs text-slate-600 select-none" style={{ background: '#f0f0f0' }}>
        <span className="font-bold text-slate-800 mr-2">Dev Studio</span>
        {['File','Edit','View','Terminal','Help'].map((m) => (
          <span key={m} className="hidden sm:inline hover:bg-[#e0e0e0] cursor-pointer px-2 py-0.5 rounded">{m}</span>
        ))}
        <div className="ml-auto flex items-center gap-2 sm:gap-3 text-slate-500">
          <span className="flex items-center gap-1 text-green-700 font-medium">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" /> main
          </span>
          <span className="hidden sm:inline">Elevate LMS</span>
        </div>
      </div>
      {configLoadError && (
        <div className="flex-shrink-0 px-3 py-1 text-[11px] text-amber-700 bg-amber-50 border-b border-amber-200">
          Custom studio config could not be loaded; using defaults.
        </div>
      )}

      {/* Editor tab strip — white active tab, light inactive */}
      <div className="flex-shrink-0 flex items-end border-b border-[#ddd] overflow-x-auto" style={{ background: '#ececec', scrollbarWidth: 'none' }}>
        {openTabs.map((t) => {
          const def = TABS.find((x) => x.id === t)!;
          return (
            <button key={t} onClick={() => openTab(t)}
              className={`flex items-center gap-1.5 px-2 sm:px-4 py-2 text-[11px] sm:text-xs border-r border-[#ddd] whitespace-nowrap flex-shrink-0 group transition-colors ${
                tab === t
                  ? 'bg-white text-slate-900 border-t-2 border-t-[#f97316]'
                  : 'text-slate-500 hover:bg-[#e4e4e4]'
              }`} style={{ background: tab === t ? '#ffffff' : undefined }}>
              <def.Icon className="w-3.5 h-3.5 opacity-50" />
              <span>{tabFiles[t]}</span>
              <span onClick={(e) => closeTab(t, e)}
                className="ml-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-80 rounded p-0.5 hover:bg-slate-200">
                <X className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Body: activity bar + editor */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Activity bar — Gitpod uses a medium-dark sidebar */}
        <div className="flex-shrink-0 flex flex-col items-center py-2 gap-1 w-12 border-r border-[#ddd]" style={{ background: '#e8e8e8' }}>
          {TABS.map(({ id, Icon, label }) => (
            <button key={id} title={label} onClick={() => openTab(id)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                tab === id
                  ? 'bg-white text-orange-500 shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
              }`}>
              {tab === id && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r" style={{ background: '#f97316' }} />
              )}
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Editor area — bright white */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white">
          {tab === 'command'   && <CommandTab quickCommands={studioConfig?.quickCommands} />}
          {tab === 'chat'      && <AIChat />}
          {tab === 'terminal'  && <TerminalTab workflowButtons={studioConfig?.workflowButtons} />}
          {tab === 'files'     && <FilesTab />}
          {tab === 'website'   && <WebsiteTab config={studioConfig} />}
          {tab === 'container' && <DevContainerPanel />}
        </div>
      </div>

      {/* Status bar — Gitpod orange/brand accent */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-3 py-1 text-white text-[10px] select-none" style={{ background: '#f97316' }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1">⎇ main</span>
          <span className="hidden sm:inline">Elevate LMS · Dev Container</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 opacity-90">
          <span>UTF-8</span>
          <span>TypeScript React</span>
          <span>port 3000</span>
        </div>
      </div>
    </div>
  );
}

// ── Command Tab ──────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

interface LogLine { type: 'user' | 'system' | 'error' | 'stream'; text: string; }
interface Job { id: string; command: string; status: string; log_lines: LogLine[]; started_at: string; }

// ── ANSI → plain text (strip colour codes for display) ───────────────────────
/* eslint-disable no-control-regex */
function stripAnsi(s: string) { return s.replace(/\x1b\[[0-9;]*m/g, ''); }
/* eslint-enable no-control-regex */

// ── CommandTab ───────────────────────────────────────────────────────────────

function CommandTab({ quickCommands }: { quickCommands?: string[] }) {
  const [input, setInput]       = useState('');
  const [lines, setLines]       = useState<LogLine[]>([]);
  const [loading, setLoading]   = useState(false);
  const [jobId, setJobId]       = useState<string | null>(null);
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  // Auto-scroll on new lines
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  // Load job history on mount (reconnect support — survives page reload)
  useEffect(() => {
    fetch('/api/devstudio/jobs?limit=20')
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(d => setJobs(d.jobs ?? []))
      .catch(() => {});
  }, []);

  const QUICK = quickCommands?.length ? quickCommands : [
    'Show git status',
    'List recent files changed',
    'Run pnpm lint',
    'Show build errors',
    'List open ports',
    'Show loaded secrets (key names only)',
  ];

  const QUICK_ACTIONS = [
    { label: 'Analytics',        cmd: 'Get platform analytics overview' },
    { label: 'Applications',     cmd: 'List pending applications' },
    { label: 'Students',         cmd: 'List recent students' },
    { label: 'Enrollments',      cmd: 'List recent enrollments' },
    { label: 'Programs',         cmd: 'List all published programs' },
    { label: 'WIOA cases',       cmd: 'List pending WIOA cases' },
    { label: 'Payout queue',     cmd: 'List payout queue' },
    { label: 'System health',    cmd: 'Check system health' },
    { label: 'Daily report',     cmd: 'Run daily report' },
    { label: 'Enrollment report',cmd: 'Run enrollment report' },
    { label: 'Financial report', cmd: 'Run financial report' },
    { label: 'Export students',  cmd: 'Export students CSV' },
  ];

  const AUTOPILOT = [
    { label: '🏗 Build courses',  cmd: 'Build all courses and push to GitHub' },
    { label: '🚀 Deploy LMS',     cmd: 'Deploy the LMS service' },
    { label: '🚀 Deploy Admin',   cmd: 'Deploy the admin service' },
    { label: '🧪 Run tests',      cmd: 'Run autopilot test suite' },
    { label: '🎬 Generate video', cmd: 'Generate a lesson video' },
    { label: '📚 Generate course',cmd: 'Generate a new course' },
  ];

  async function run(cmd: string) {
    if (!cmd.trim() || loading) return;

    // Cancel any in-flight stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setInput('');
    setActiveJob(null);
    setShowHistory(false);

    const startLine: LogLine = { type: 'user', text: cmd };
    setLines([startLine]);
    setLoading(true);

    // Create persistent job row
    let currentJobId = `temp-${Date.now()}`;
    try {
      const jr = await fetch('/api/devstudio/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      if (jr.ok) { const jd = await jr.json(); currentJobId = jd.jobId; }
    } catch { /* non-fatal */ }
    setJobId(currentJobId);

    const streamLines: string[] = [];

    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        let errText = 'Request failed';
        try { const d = await res.json(); errText = d.error ?? errText; } catch { /* ignore */ }
        const errLine: LogLine = { type: 'error', text: errText };
        setLines([startLine, errLine]);
        await patchJob(currentJobId, [errText], 'failed');
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const payload = part.slice(6).trim();
          if (payload === '[DONE]') continue;
          let text = payload;
          try {
            const p = JSON.parse(payload);
            text = p.line ?? p.text ?? p.output ?? payload;
          } catch { /* raw line */ }
          const clean = stripAnsi(text);
          if (!clean.trim()) continue;
          streamLines.push(clean);
          setLines(prev => [...prev, { type: 'stream', text: clean }]);
        }
      }

      // Persist final log to DB
      await patchJob(currentJobId, streamLines, 'completed');

      // Refresh job history
      fetch('/api/devstudio/jobs?limit=20')
        .then(r => r.ok ? r.json() : { jobs: [] })
        .then(d => setJobs(d.jobs ?? []))
        .catch(() => {});

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errLine: LogLine = { type: 'error', text: 'Stream disconnected — output above is preserved. Re-run to retry.' };
      setLines(prev => [...prev, errLine]);
      await patchJob(currentJobId, [...streamLines, errLine.text], 'failed');
    } finally {
      setLoading(false);
    }
  }

  async function patchJob(id: string, newLines: string[], status: string) {
    try {
      await fetch('/api/devstudio/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, lines: newLines, status, finished_at: new Date().toISOString() }),
      });
    } catch { /* non-fatal */ }
  }

  function loadJob(job: Job) {
    setActiveJob(job);
    setShowHistory(false);
    const restored: LogLine[] = [
      { type: 'user', text: job.command },
      ...(job.log_lines ?? []).map((l: LogLine) => ({ ...l, type: 'stream' as const })),
    ];
    setLines(restored);
  }

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-green-600' : s === 'failed' ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="flex h-full overflow-hidden bg-white">

      {/* ── History sidebar ── */}
      {showHistory && (
        <div className="w-56 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">History</span>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {jobs.length === 0 && (
              <p className="text-xs text-slate-400 p-3 italic">No previous jobs</p>
            )}
            {jobs.map(j => (
              <button key={j.id} onClick={() => loadJob(j)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-100 hover:bg-white transition-colors ${activeJob?.id === j.id ? 'bg-white border-l-2 border-l-orange-400' : ''}`}>
                <p className="text-[11px] font-medium text-slate-700 truncate">{j.command}</p>
                <p className={`text-[10px] mt-0.5 ${statusColor(j.status)}`}>
                  {j.status} · {new Date(j.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Quick action buttons */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap gap-1.5 p-2.5 pb-2">
            {QUICK_ACTIONS.map(({ label, cmd }) => (
              <button key={label} onClick={() => run(cmd)} disabled={loading}
                className="px-2.5 py-1 text-[11px] rounded-md border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-700 disabled:opacity-40 transition-colors shadow-sm">
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 px-2.5 pb-2.5 border-t border-slate-100 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-0.5">Autopilot</span>
            {AUTOPILOT.map(({ label, cmd }) => (
              <button key={label} onClick={() => run(cmd)} disabled={loading}
                className="px-2.5 py-1 text-[11px] rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 text-blue-700 disabled:opacity-40 transition-colors shadow-sm">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Log output — live streaming */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-white space-y-0.5">
          {lines.length === 0 && !loading && (
            <p className="text-slate-400 italic pt-2">// Type a command below or click a shortcut above</p>
          )}
          {lines.map((l, i) => (
            <div key={i} className={
              l.type === 'user'   ? 'text-orange-500 font-bold' :
              l.type === 'error'  ? 'text-red-500 bg-red-50 rounded px-1' :
              'text-slate-700'
            }>
              {l.type === 'user' ? `$ ${l.text}` : l.text}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 text-orange-400 animate-pulse pt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-3">
          {/* Toolbar row */}
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowHistory(h => !h)}
              className="text-[11px] text-slate-500 hover:text-slate-800 border border-slate-200 rounded px-2 py-0.5 bg-white hover:bg-slate-50 transition-colors">
              {showHistory ? 'Hide history' : `History (${jobs.length})`}
            </button>
            {loading && (
              <button onClick={() => { abortRef.current?.abort(); setLoading(false); }}
                className="text-[11px] text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-0.5 bg-red-50 hover:bg-red-100 transition-colors">
                Cancel
              </button>
            )}
            {jobId && !loading && (
              <span className="text-[10px] text-slate-400 ml-auto font-mono">job {jobId.slice(0, 8)}</span>
            )}
          </div>
          {/* Textarea + send */}
          <div className="flex gap-2 items-end">
            <span className="text-orange-500 font-mono text-sm font-bold mb-1.5">$</span>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(input); } }}
              placeholder="Tell it what to do… e.g. 'Run enrollment report', 'Generate a CNA course', 'List at-risk students'"
              rows={4}
              disabled={loading}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-xs outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400 font-mono resize-none disabled:opacity-60"
            />
            <button onClick={() => run(input)} disabled={loading || !input.trim()}
              className="mb-0 p-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-colors self-end">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Enter to run · Shift+Enter for new line · Output persists across page reloads</p>
        </div>
      </div>
    </div>
  );
}
// ── Terminal Tab ─────────────────────────────────────────────────────────────

interface RunStatus {
  id: number;
  status: string;
  conclusion: string | null;
  url: string;
}

const WORKFLOW_BUTTONS: { key: WorkflowKey; label: string; description: string }[] = [
  { key: 'deploy-lms',   label: 'Deploy LMS',   description: 'Build + push LMS to ECS' },
  { key: 'deploy-admin', label: 'Deploy Admin',  description: 'Build + push Admin to ECS' },
  { key: 'ci',           label: 'Run CI',        description: 'Full CI pipeline' },
  { key: 'lint',         label: 'Lint',          description: 'Run pnpm lint' },
];

function TerminalTab({
  workflowButtons,
}: {
  workflowButtons?: { key: WorkflowKey; label: string; description: string }[];
}) {
  const [lines, setLines] = useState<string[]>([
    'Dev Studio — GitHub Actions runner',
    'Click a workflow button to trigger a deployment or CI run.',
    'Changes committed via the Explorer tab will trigger auto-deploy on push to main.',
    '',
  ]);
  const [loading, setLoading] = useState<WorkflowKey | null>(null);
  const [activeRun, setActiveRun] = useState<RunStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Track the poll timeout so we can cancel it on unmount or new dispatch
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  function schedulePoll(runId: number, attempt = 0) {
    const MAX_ATTEMPTS = 60; // ~8 min at 8s intervals
    if (attempt >= MAX_ATTEMPTS) {
      if (mountedRef.current) {
        setLines((p) => [...p, `⚠ Polling timed out for run #${runId}`, '']);
      }
      return;
    }
    pollTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(`/api/devstudio/shell?run_id=${runId}`);
        if (!mountedRef.current) return;
        if (!res.ok) {
          // Retry on transient errors
          schedulePoll(runId, attempt + 1);
          return;
        }
        const d: RunStatus = await res.json();
        setActiveRun(d);
        if (d.status === 'completed') {
          setLines((p) => [...p,
            `Run #${runId} completed — ${d.conclusion ?? 'unknown'}`,
            `   ${d.url}`,
            '',
          ]);
        } else {
          schedulePoll(runId, attempt + 1);
        }
      } catch {
        // Retry on network errors
        if (mountedRef.current) schedulePoll(runId, attempt + 1);
      }
    }, 8000);
  }

  async function dispatch(workflow: WorkflowKey) {
    // Cancel any in-flight poll before starting a new dispatch
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setLoading(workflow);
    setLines((p) => [...p, `▶ Dispatching ${workflow}…`]);
    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });
      const d = await res.json();
      if (!res.ok) {
        setLines((p) => [...p, `❌ ${d.error ?? 'Dispatch failed'}`]);
      } else {
        setLines((p) => [...p,
          `✅ Workflow queued — run #${d.runId ?? '?'}`,
          `   Status: ${d.status}`,
          `   URL: ${d.runUrl}`,
          '',
        ]);
        if (d.runId) {
          setActiveRun({ id: d.runId, status: d.status, conclusion: null, url: d.runUrl });
          schedulePoll(d.runId);
        }
      }
    } catch {
      setLines((p) => [...p, '❌ Request failed']);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Workflow buttons */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        {(workflowButtons && workflowButtons.length > 0 ? workflowButtons : WORKFLOW_BUTTONS).map(({ key, label, description }) => (
          <button key={key} onClick={() => dispatch(key)} disabled={!!loading}
            title={description}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-700 disabled:opacity-50 transition-colors shadow-sm">
            {loading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {label}
          </button>
        ))}
        {activeRun && (
          <a href={activeRun.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ExternalLink className="w-3 h-3" />
            {activeRun.status === 'completed'
              ? `${activeRun.conclusion ?? 'done'}`
              : activeRun.status}
          </a>
        )}
      </div>
      {/* Output log */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5 bg-white">
        {lines.map((l, i) => (
          <div key={i} className={
            l.startsWith('▶') ? 'text-orange-600 font-semibold' :
            l.startsWith('✅') ? 'text-green-600' :
            l.startsWith('❌') ? 'text-red-600' :
            l.startsWith('Run #') ? 'text-blue-600' :
            'text-slate-600'
          }>{l || '\u00a0'}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-slate-200 bg-slate-50">
        <span className="text-[10px] text-slate-400">Workflows run on GitHub Actions — changes deploy automatically on push to main</span>
        <button onClick={() => setLines([])} className="text-[10px] text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded hover:bg-slate-200">Clear</button>
      </div>
    </div>
  );
}
// ── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [showTree, setShowTree] = useState(true);

  useEffect(() => {
    fetch('/api/devstudio/files').then((r) => r.json()).then((d) => setTree(d.tree ?? [])).catch(() => {});
  }, []);

  async function loadFile(path: string) {
    setSelected(path);
    setSaveMsg('');
    const r = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`);
    const d = await r.json();
    setContent(d.content ?? '');
    setFileSha(d.sha ?? '');
    setCommitMsg(`chore: update ${path} via Dev Studio`);
  }

  async function saveFile() {
    if (!selected || !fileSha) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const r = await fetch('/api/devstudio/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, content, sha: fileSha, message: commitMsg }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSaveMsg(`❌ ${d.error ?? 'Save failed'}`);
      } else {
        // Update sha so next save uses the new blob sha
        if (d.sha) setFileSha(d.sha);
        setSaveMsg(d.commit ? `✅ Committed` : '✅ Saved');
        setTimeout(() => setSaveMsg(''), 4000);
      }
    } catch {
      setSaveMsg('❌ Request failed');
    } finally {
      setSaving(false);
    }
  }

  function renderNode(node: FileNode, depth = 0): React.ReactNode {
    const pad = depth * 12;
    if (node.type === 'directory') return (
      <div key={node.path}>
        <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 cursor-pointer select-none" style={{ paddingLeft: 8 + pad }}>
          <ChevronRight className="w-3 h-3 text-slate-400" /><Folder className="w-3.5 h-3.5 text-amber-500" /><span>{node.name}</span>
        </div>
        {node.children?.map((c) => renderNode(c, depth + 1))}
      </div>
    );
    return (
      <div key={node.path} onClick={() => loadFile(node.path)}
        className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] cursor-pointer select-none transition-colors ${selected === node.path ? 'bg-brand-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        style={{ paddingLeft: 8 + pad }}>
        <File className={`w-3.5 h-3.5 ${selected === node.path ? 'text-white' : 'text-brand-blue-500'}`} /><span>{node.name}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-white">
      <div className="md:hidden px-3 py-2 border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setShowTree((prev) => !prev)}
          className="text-xs font-semibold text-slate-700"
        >
          {showTree ? 'Hide Explorer' : 'Show Explorer'}
        </button>
      </div>
      {/* Sidebar */}
      <div className={`${showTree ? 'block' : 'hidden'} md:block w-full md:w-52 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50 max-h-48 md:max-h-none`}>
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Explorer</div>
        {tree.map((n) => renderNode(n))}
      </div>
      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selected ? (
          <>
            <div className="flex-shrink-0 flex flex-col gap-1 px-4 py-1.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-mono">{selected}</span>
                {saveMsg && <span className="text-[11px] text-slate-600">{saveMsg}</span>}
                <button onClick={saveFile} disabled={saving || !fileSha}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-md bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-colors">
                  <Save className="w-3 h-3" />{saving ? 'Committing…' : 'Commit'}
                </button>
              </div>
              <input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Commit message…"
                className="text-[11px] font-mono bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 outline-none focus:border-orange-400"
              />
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor
                value={content}
                onChange={(val) => setContent(val)}
                filePath={selected}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
            <FolderOpen className="w-10 h-10" />
            <p className="text-xs text-slate-400">Select a file to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Website Tab ──────────────────────────────────────────────────────────────

function WebsiteTab({ config }: { config: DevStudioConfig | null }) {
  const defaultUrl = config?.defaultPreviewUrl || 'https://www.elevateforhumanity.org';
  const targets = config?.previewTargets ?? [];
  const [url, setUrl] = useState(defaultUrl);
  const [input, setInput] = useState(defaultUrl);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Browser chrome */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <button onClick={() => setViewport('desktop')} title="Desktop"
          className={`p-1.5 rounded-md transition-colors ${viewport === 'desktop' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}>
          <Monitor className="w-4 h-4" />
        </button>
        <button onClick={() => setViewport('mobile')} title="Mobile"
          className={`p-1.5 rounded-md transition-colors ${viewport === 'mobile' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}>
          <Smartphone className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1 shadow-sm">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setUrl(input)}
            className="flex-1 bg-transparent text-slate-700 text-xs outline-none font-mono" />
        </div>
        <button onClick={() => { setLoading(true); setUrl(input); }}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      {targets.length > 0 && (
        <div className="flex-shrink-0 flex flex-wrap gap-2 px-3 py-2 border-b border-slate-200 bg-white">
          {targets.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                setLoading(true);
                setInput(t.url);
                setUrl(t.url);
              }}
              className="px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-600 hover:border-brand-blue-300 hover:text-brand-blue-700"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {/* Viewport — iframe fills the panel; mobile mode centres a 390px column */}
      <div className={`flex-1 overflow-auto flex bg-white ${viewport === 'mobile' ? 'items-start justify-center p-4 bg-slate-100' : ''}`}>
        <div className={`relative transition-all ${viewport === 'mobile' ? 'w-[390px] max-w-full shadow-xl rounded-lg overflow-hidden' : 'w-full h-full'}`}
          style={viewport === 'desktop' ? { height: '100%' } : undefined}>
          {loading && (
            <div className="absolute inset-x-0 top-0 flex items-center justify-center h-8 bg-white/80 z-10 border-b border-slate-100">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          )}
          <iframe
            src={url}
            className="w-full border-0"
            style={{ height: viewport === 'mobile' ? '844px' : '100%' }}
            onLoad={() => setLoading(false)}
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
