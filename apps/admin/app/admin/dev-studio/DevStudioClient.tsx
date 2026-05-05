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
    <div className="flex flex-col text-slate-800 min-h-[calc(100dvh-64px)]" style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", background: '#f5f5f5' }}>
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

function CommandTab({ quickCommands }: { quickCommands?: string[] }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<{ type: 'user' | 'system' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [output]);

  const QUICK = quickCommands && quickCommands.length > 0 ? quickCommands : [
    'Show git status',
    'List recent files changed',
    'Run pnpm lint',
    'Show build errors',
    'List open ports',
    'Show loaded secrets (key names only)',
  ];

  async function run(cmd: string) {
    if (!cmd.trim()) return;
    setOutput((p) => [...p, { type: 'user', text: cmd }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      setOutput((p) => [...p, { type: res.ok ? 'system' : 'error', text: data.output ?? data.error ?? 'No output' }]);
    } catch {
      setOutput((p) => [...p, { type: 'error', text: 'Request failed' }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Quick commands */}
      <div className="flex-shrink-0 flex flex-wrap gap-1.5 p-3 border-b border-slate-200 bg-slate-50">
        {QUICK.map((q) => (
          <button key={q} onClick={() => run(q)}
            className="px-2.5 py-1 text-[11px] rounded-md border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-700 transition-colors shadow-sm">
            {q}
          </button>
        ))}
      </div>
      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-white">
        {output.length === 0 && (
          <p className="text-slate-400 italic">// Type a plain-English command or click a shortcut above</p>
        )}
        {output.map((o, i) => (
          <div key={i}>
            {o.type === 'user' && <p className="text-orange-600 font-semibold">$ {o.text}</p>}
            {o.type === 'system' && <pre className="text-slate-700 whitespace-pre-wrap bg-slate-50 rounded p-2 border border-slate-100">{o.text}</pre>}
            {o.type === 'error' && <pre className="text-red-600 whitespace-pre-wrap bg-red-50 rounded p-2 border border-red-100">{o.text}</pre>}
          </div>
        ))}
        {loading && <p className="text-orange-500 animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Running…</p>}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-t border-slate-200 bg-slate-50">
        <span className="text-orange-500 font-mono text-xs font-bold">$</span>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run(input)}
          placeholder="Enter a plain-English command…"
          className="flex-1 bg-transparent text-slate-800 text-xs outline-none placeholder-slate-400 font-mono" />
        <button onClick={() => run(input)} disabled={loading || !input.trim()}
          className="p-1.5 rounded-md bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-colors">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
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
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  async function dispatch(workflow: WorkflowKey) {
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
          pollRun(d.runId);
        }
      }
    } catch {
      setLines((p) => [...p, '❌ Request failed']);
    } finally {
      setLoading(null);
    }
  }

  async function pollRun(runId: number) {
    const poll = async () => {
      try {
        const res = await fetch(`/api/devstudio/shell?run_id=${runId}`);
        if (!res.ok) return;
        const d: RunStatus = await res.json();
        setActiveRun(d);
        if (d.status === 'completed') {
          setLines((p) => [...p,
            `Run #${runId} completed — ${d.conclusion ?? 'unknown'}`,
            `   ${d.url}`,
            '',
          ]);
        } else {
          setTimeout(poll, 8000);
        }
      } catch { /* ignore poll errors */ }
    };
    setTimeout(poll, 8000);
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
      {/* Viewport */}
      <div className="flex-1 overflow-auto flex items-start justify-center bg-slate-100 p-4">
        <div className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all ${viewport === 'mobile' ? 'w-[min(390px,100%)]' : 'w-full'} h-full`}>
          {loading && (
            <div className="flex items-center justify-center h-12 bg-slate-50 border-b border-slate-200">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          )}
          <iframe src={url} className="w-full h-full border-0" onLoad={() => setLoading(false)} title="Preview" />
        </div>
      </div>
    </div>
  );
}
