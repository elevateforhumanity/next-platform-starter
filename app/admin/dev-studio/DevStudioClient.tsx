'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Sparkles, MessageSquare, Terminal, FolderOpen, Globe, Box,
  Send, Loader2, RefreshCw, ExternalLink, Save,
  ChevronRight, File, Folder, Monitor, Smartphone, Play, X, Circle,
} from 'lucide-react';

const XTerminal         = dynamic(() => import('@/components/dev-studio/XTerminal'),         { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const AIChat            = dynamic(() => import('@/components/dev-studio/AIChat'),            { ssr: false });

type Tab = 'command' | 'terminal' | 'files' | 'website' | 'container' | 'chat';
interface FileNode { name: string; path: string; type: 'file' | 'directory'; children?: FileNode[]; }

const TABS: { id: Tab; Icon: React.ElementType; label: string }[] = [
  { id: 'command',   Icon: Sparkles,      label: 'Command'   },
  { id: 'chat',      Icon: MessageSquare, label: 'AI Chat'   },
  { id: 'terminal',  Icon: Terminal,      label: 'Terminal'  },
  { id: 'files',     Icon: FolderOpen,    label: 'Explorer'  },
  { id: 'website',   Icon: Globe,         label: 'Preview'   },
  { id: 'container', Icon: Box,           label: 'Container' },
];

const TAB_FILES: Record<Tab, string> = {
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
    <div className="flex flex-col bg-white text-slate-800" style={{ height: 'calc(100vh - 64px)', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
      {/* Menu bar */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-1 bg-[#f3f3f3] border-b border-[#e0e0e0] text-xs text-slate-600 select-none">
        <span className="font-bold text-slate-800">Dev Studio</span>
        <span className="text-slate-300">|</span>
        {['File','Edit','View','Terminal','Help'].map((m) => (
          <span key={m} className="hover:text-slate-900 cursor-pointer px-1 py-0.5 rounded hover:bg-[#e0e0e0]">{m}</span>
        ))}
        <div className="ml-auto flex items-center gap-2 text-slate-400">
          <span className="text-green-600 font-semibold">● main</span>
          <span>Elevate LMS</span>
        </div>
      </div>
      {/* Editor tab strip */}
      <div className="flex-shrink-0 flex items-end bg-[#ececec] border-b border-[#e0e0e0] overflow-x-auto" style={{ scrollbarWidth:'none' }}>
        {openTabs.map((t) => {
          const def = TABS.find((x) => x.id === t)!;
          return (
            <button key={t} onClick={() => openTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs border-r border-[#e0e0e0] whitespace-nowrap flex-shrink-0 group transition-colors ${
                tab === t ? 'bg-white text-slate-900 border-t-2 border-t-[#0066b8]' : 'bg-[#ececec] text-slate-500 hover:bg-[#e4e4e4]'
              }`}>
              <def.Icon className="w-3.5 h-3.5 opacity-60" />
              <span>{TAB_FILES[t]}</span>
              <span onClick={(e) => closeTab(t, e)} className="ml-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 rounded p-0.5 hover:bg-slate-300">
                <X className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>
      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Activity bar */}
        <div className="flex-shrink-0 flex flex-col items-center py-2 gap-0.5 bg-[#2c2c2c] w-12 border-r border-[#1e1e1e]">
          {TABS.map(({ id, Icon, label }) => (
            <button key={id} title={label} onClick={() => openTab(id)}
              className={`relative flex items-center justify-center w-10 h-10 rounded transition-colors ${
                tab === id ? 'text-white bg-[#3c3c3c]' : 'text-[#858585] hover:text-white hover:bg-[#3c3c3c]'
              }`}>
              {tab === id && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#0066b8] rounded-r" />}
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
        {/* Editor */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white">
          {tab === 'command'   && <CommandTab />}
          {tab === 'chat'      && <AIChat />}
          {tab === 'terminal'  && <TerminalTab />}
          {tab === 'files'     && <FilesTab />}
          {tab === 'website'   && <WebsiteTab />}
          {tab === 'container' && <DevContainerPanel />}
        </div>
      </div>
      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-0.5 bg-[#0066b8] text-white text-[10px] select-none">
        <div className="flex items-center gap-3">
          <span>⎇ main</span>
          <span>Elevate LMS · Dev Container</span>
        </div>
        <div className="flex items-center gap-3 opacity-80">
          <span>UTF-8</span><span>TypeScript React</span><span>port 3000</span>
        </div>
      </div>
    </div>
  );
}

// ── Command Tab ──────────────────────────────────────────────────────────────

function CommandTab() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<{ type: 'user' | 'system' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [output]);

  const QUICK = [
    'Show git status', 'List recent files changed', 'Run pnpm lint',
    'Show build errors', 'List open ports', 'Show env vars',
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
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4]">
      {/* Quick commands */}
      <div className="flex-shrink-0 flex flex-wrap gap-1.5 p-3 border-b border-[#3c3c3c] bg-[#252526]">
        {QUICK.map((q) => (
          <button key={q} onClick={() => run(q)}
            className="px-2.5 py-1 text-[11px] rounded bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] transition-colors">
            {q}
          </button>
        ))}
      </div>
      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {output.length === 0 && (
          <p className="text-[#6a9955] italic">// Type a plain-English command or click a shortcut above</p>
        )}
        {output.map((o, i) => (
          <div key={i}>
            {o.type === 'user' && <p className="text-[#569cd6]">$ {o.text}</p>}
            {o.type === 'system' && <pre className="text-[#d4d4d4] whitespace-pre-wrap">{o.text}</pre>}
            {o.type === 'error' && <pre className="text-[#f44747] whitespace-pre-wrap">{o.text}</pre>}
          </div>
        ))}
        {loading && <p className="text-[#569cd6] animate-pulse">Running…</p>}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-t border-[#3c3c3c] bg-[#252526]">
        <span className="text-[#569cd6] font-mono text-xs">$</span>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run(input)}
          placeholder="Enter a command…"
          className="flex-1 bg-transparent text-[#d4d4d4] text-xs outline-none placeholder-[#6a6a6a] font-mono" />
        <button onClick={() => run(input)} disabled={loading || !input.trim()}
          className="p-1.5 rounded bg-[#0066b8] hover:bg-[#0078d4] disabled:opacity-40 transition-colors">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
// ── Terminal Tab ─────────────────────────────────────────────────────────────

function TerminalTab() {
  const [lines, setLines] = useState<string[]>(['Welcome to Dev Studio terminal. Type a shell command.']);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  async function runShell(cmd: string) {
    if (!cmd.trim()) return;
    setLines((p) => [...p, `$ ${cmd}`]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const text = await res.text();
      setLines((p) => [...p, ...text.split('\n').filter(Boolean)]);
    } catch { setLines((p) => [...p, 'Error: request failed']); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4]">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
        <Terminal className="w-3.5 h-3.5 text-[#858585]" />
        <span className="text-xs text-[#cccccc]">bash</span>
        <button onClick={() => setLines([])} className="ml-auto text-[10px] text-[#858585] hover:text-white px-2 py-0.5 rounded hover:bg-[#3c3c3c]">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith('$') ? 'text-[#569cd6]' : l.toLowerCase().includes('error') ? 'text-[#f44747]' : 'text-[#d4d4d4]'}>
            {l}
          </div>
        ))}
        {loading && <div className="text-[#569cd6] animate-pulse">▋</div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-t border-[#3c3c3c] bg-[#252526]">
        <span className="text-[#569cd6] text-xs font-mono">$</span>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runShell(input)}
          placeholder="shell command…"
          className="flex-1 bg-transparent text-[#d4d4d4] text-xs outline-none placeholder-[#6a6a6a] font-mono" />
        <button onClick={() => runShell(input)} disabled={loading || !input.trim()}
          className="p-1.5 rounded bg-[#3c3c3c] hover:bg-[#4c4c4c] disabled:opacity-40">
          <Play className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
// ── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/devstudio/files').then((r) => r.json()).then((d) => setTree(d.tree ?? [])).catch(() => {});
  }, []);

  async function loadFile(path: string) {
    setSelected(path);
    const r = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`);
    const d = await r.json();
    setContent(d.content ?? '');
    setSaved(false);
  }

  async function saveFile() {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/devstudio/files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: selected, content }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function renderNode(node: FileNode, depth = 0): React.ReactNode {
    const pad = depth * 12;
    if (node.type === 'directory') return (
      <div key={node.path}>
        <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer select-none" style={{ paddingLeft: 8 + pad }}>
          <ChevronRight className="w-3 h-3 text-[#858585]" /><Folder className="w-3.5 h-3.5 text-[#dcb67a]" /><span>{node.name}</span>
        </div>
        {node.children?.map((c) => renderNode(c, depth + 1))}
      </div>
    );
    return (
      <div key={node.path} onClick={() => loadFile(node.path)}
        className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] cursor-pointer select-none transition-colors ${selected === node.path ? 'bg-[#094771] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
        style={{ paddingLeft: 8 + pad }}>
        <File className="w-3.5 h-3.5 text-[#519aba]" /><span>{node.name}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#1e1e1e]">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-[#3c3c3c] overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#bbbbbb]">Explorer</div>
        {tree.map((n) => renderNode(n))}
      </div>
      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
              <span className="text-[11px] text-[#cccccc] font-mono">{selected}</span>
              <button onClick={saveFile} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] rounded bg-[#0066b8] hover:bg-[#0078d4] text-white disabled:opacity-50">
                <Save className="w-3 h-3" />{saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-4 resize-none outline-none leading-relaxed" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#858585] gap-2">
            <FolderOpen className="w-10 h-10 opacity-30" />
            <p className="text-xs">Select a file to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Website Tab ──────────────────────────────────────────────────────────────

function WebsiteTab() {
  const [url, setUrl] = useState('https://www.elevateforhumanity.org');
  const [input, setInput] = useState(url);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Browser chrome */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#2c2c2c] border-b border-[#3c3c3c]">
        <button onClick={() => setViewport('desktop')} title="Desktop"
          className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-[#0066b8] text-white' : 'text-[#858585] hover:text-white hover:bg-[#3c3c3c]'}`}>
          <Monitor className="w-4 h-4" />
        </button>
        <button onClick={() => setViewport('mobile')} title="Mobile"
          className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-[#0066b8] text-white' : 'text-[#858585] hover:text-white hover:bg-[#3c3c3c]'}`}>
          <Smartphone className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#3c3c3c] rounded px-3 py-1">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setUrl(input)}
            className="flex-1 bg-transparent text-[#d4d4d4] text-xs outline-none font-mono" />
        </div>
        <button onClick={() => { setLoading(true); setUrl(input); }}
          className="p-1.5 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c]">
          <RefreshCw className="w-4 h-4" />
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c]">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      {/* Viewport */}
      <div className="flex-1 overflow-auto flex items-start justify-center bg-[#1e1e1e] p-4">
        <div className={`bg-white shadow-2xl transition-all ${viewport === 'mobile' ? 'w-[390px]' : 'w-full'} h-full`}>
          {loading && (
            <div className="flex items-center justify-center h-16 bg-[#252526]">
              <Loader2 className="w-5 h-5 text-[#858585] animate-spin" />
            </div>
          )}
          <iframe src={url} className="w-full h-full border-0" onLoad={() => setLoading(false)} title="Preview" />
        </div>
      </div>
    </div>
  );
}
