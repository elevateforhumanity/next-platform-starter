'use client';

/**
 * DevStudioClient — full admin Dev Studio.
 *
 * Tabs:
 *   Command   — plain-English commands via /api/devstudio/execute (AI-mapped)
 *   Terminal  — raw shell via /api/devstudio/shell (streamed SSE)
 *   Files     — read/write repo files via /api/devstudio/files
 *   Website   — live iframe preview of the production site with edit shortcuts
 *
 * Everything runs inside the dev container — no Gitpod dependency.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Terminal,
  Sparkles,
  FolderOpen,
  Globe,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  Save,
  ChevronRight,
  File,
  Folder,
  Monitor,
  Smartphone,
  Play,
  X,
} from 'lucide-react';

const XTerminal = dynamic(() => import('@/components/dev-studio/XTerminal'), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'command' | 'terminal' | 'files' | 'website';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

// ── Quick command suggestions ─────────────────────────────────────────────────

const QUICK_COMMANDS = [
  { label: 'List programs', cmd: 'List all published programs' },
  { label: 'Pending applications', cmd: 'Show pending applications' },
  { label: 'Recent enrollments', cmd: 'Show recent enrollments' },
  { label: 'Payout queue', cmd: 'Show payout queue' },
  { label: 'WIOA cases', cmd: 'List WIOA cases pending approval' },
  { label: 'Run enrollment report', cmd: 'Run the enrollment report' },
  { label: 'Run financial report', cmd: 'Run the financial report' },
  { label: 'System health', cmd: 'Check system health' },
  { label: 'Export students CSV', cmd: 'Export students as CSV' },
  { label: 'List cohorts', cmd: 'List all cohorts' },
];

const QUICK_SHELL = [
  { label: 'pnpm build', cmd: 'pnpm next build' },
  { label: 'Type check', cmd: 'npx tsc --noEmit' },
  { label: 'Lint', cmd: 'pnpm lint' },
  { label: 'Git status', cmd: 'git status' },
  { label: 'Git log', cmd: 'git log --oneline -10' },
  { label: 'List blueprints', cmd: 'pnpm tsx scripts/seed-course-from-blueprint.ts --list' },
  { label: 'Disk usage', cmd: 'du -sh .next public node_modules 2>/dev/null || true' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function DevStudioClient() {
  const [tab, setTab] = useState<Tab>('command');

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        {(
          [
            { id: 'command', label: 'Command', Icon: Sparkles },
            { id: 'terminal', label: 'Terminal', Icon: Terminal },
            { id: 'files', label: 'Files', Icon: FolderOpen },
            { id: 'website', label: 'Website', Icon: Globe },
          ] as { id: Tab; label: string; Icon: React.ElementType }[]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-brand-red-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <div className="ml-auto text-xs text-slate-500 font-mono">dev container · port 3000</div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'command' && <CommandTab />}
        {tab === 'terminal' && <TerminalTab />}
        {tab === 'files' && <FilesTab />}
        {tab === 'website' && <WebsiteTab />}
      </div>
    </div>
  );
}

// ── Command Tab ───────────────────────────────────────────────────────────────

function CommandTab() {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([
    '\x1b[1;36m Elevate Dev Studio — Command Interface\x1b[0m',
    '\x1b[90mType a plain-English command or pick one below.\x1b[0m',
    '',
  ]);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const ansiToHtml = (text: string) => {
    const esc = '\u001b\\[';

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(new RegExp(`${esc}0m`, 'g'), '</span>')
      .replace(new RegExp(`${esc}1;36m`, 'g'), '<span style="color:#39c5cf;font-weight:bold">')
      .replace(new RegExp(`${esc}1;33m`, 'g'), '<span style="color:#d29922;font-weight:bold">')
      .replace(new RegExp(`${esc}32m`, 'g'), '<span style="color:#3fb950">')
      .replace(new RegExp(`${esc}31m`, 'g'), '<span style="color:#f85149">')
      .replace(new RegExp(`${esc}33m`, 'g'), '<span style="color:#d29922">')
      .replace(new RegExp(`${esc}90m`, 'g'), '<span style="color:#6e7681">')
      .replace(new RegExp(`${esc}\\d+m`, 'g'), '');
  };

  async function run(cmd: string) {
    if (!cmd.trim() || running) return;
    setRunning(true);
    setOutput((prev) => [...prev, `\x1b[1;33m> ${cmd}\x1b[0m`, '']);

    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const { text } = JSON.parse(line.slice(6));
            if (text) setOutput((prev) => [...prev, text]);
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch (err) {
      setOutput((prev) => [
        ...prev,
        `\x1b[31m✗ ${err instanceof Error ? err.message : 'Error'}\x1b[0m`,
      ]);
    } finally {
      setOutput((prev) => [...prev, '']);
      setRunning(false);
    }
  }

  function submit() {
    run(input);
    setInput('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
        {output.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: ansiToHtml(line) || '&nbsp;' }} />
        ))}
        {running && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Running...</span>
          </div>
        )}
      </div>

      {/* Quick commands */}
      <div className="px-4 py-2 border-t border-slate-800 flex flex-wrap gap-1.5">
        {QUICK_COMMANDS.map((q) => (
          <button
            key={q.cmd}
            onClick={() => run(q.cmd)}
            disabled={running}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors disabled:opacity-40"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. Approve application abc-123 · Enroll student · Run report..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          disabled={running}
        />
        <button
          onClick={submit}
          disabled={running || !input.trim()}
          className="px-4 py-2.5 bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg disabled:opacity-40 transition-colors"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Terminal Tab ──────────────────────────────────────────────────────────────

function TerminalTab() {
  const termRef = useRef<{ write: (d: string) => void; clear: () => void } | null>(null);
  const [cmd, setCmd] = useState('');
  const [running, setRunning] = useState(false);

  async function runShell(command: string) {
    if (!command.trim() || running) return;
    setRunning(true);
    termRef.current?.write(`\x1b[1;33m$ ${command}\x1b[0m\n`);

    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'stdout' || evt.type === 'stderr') {
              termRef.current?.write(evt.text);
            } else if (evt.type === 'exit') {
              termRef.current?.write(
                evt.code === 0
                  ? '\x1b[32m✓ Done\x1b[0m\n'
                  : `\x1b[31m✗ Exit code ${evt.code}\x1b[0m\n`,
              );
            } else if (evt.type === 'error') {
              termRef.current?.write(`\x1b[31m✗ ${evt.text}\x1b[0m\n`);
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch (err) {
      termRef.current?.write(`\x1b[31m✗ ${err instanceof Error ? err.message : 'Error'}\x1b[0m\n`);
    } finally {
      termRef.current?.write('\n');
      setRunning(false);
    }
  }

  function submit() {
    runShell(cmd);
    setCmd('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick shell buttons */}
      <div className="px-4 py-2 border-b border-slate-800 flex flex-wrap gap-1.5">
        {QUICK_SHELL.map((q) => (
          <button
            key={q.cmd}
            onClick={() => runShell(q.cmd)}
            disabled={running}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors disabled:opacity-40"
          >
            <Play className="w-3 h-3" /> {q.label}
          </button>
        ))}
        <button
          onClick={() => termRef.current?.clear()}
          className="ml-auto px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-hidden">
        <XTerminal ref={termRef} />
      </div>

      {/* Shell input */}
      <div className="px-4 py-3 border-t border-slate-800 flex gap-2">
        <span className="text-green-400 font-mono text-sm self-center">$</span>
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Enter shell command..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={running}
        />
        <button
          onClick={submit}
          disabled={running || !cmd.trim()}
          className="px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-lg disabled:opacity-40 transition-colors"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Files Tab ─────────────────────────────────────────────────────────────────

function FilesTab() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['app', 'components', 'lib']));

  useEffect(() => {
    loadTree();
  }, []);

  async function loadTree() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/files?path=.&tree=1');
      const data = await res.json();
      setTree(data.tree ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  async function openFile(path: string) {
    setSelectedPath(path);
    setLoading(true);
    try {
      const res = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setContent(data.content ?? '');
      setOriginalContent(data.content ?? '');
      setSaveStatus('idle');
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selectedPath) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/devstudio/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content }),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginalContent(content);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const isDirty = content !== originalContent;

  function toggleDir(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  function renderNode(node: FileNode, depth = 0): React.ReactNode {
    const indent = depth * 12;
    if (node.type === 'directory') {
      const isOpen = expanded.has(node.path);
      return (
        <div key={node.path}>
          <button
            onClick={() => {
              toggleDir(node.path);
            }}
            className="flex items-center gap-1.5 w-full text-left py-1 px-2 hover:bg-slate-800 rounded text-xs text-slate-400 hover:text-slate-200 transition-colors"
            style={{ paddingLeft: `${8 + indent}px` }}
          >
            {isOpen ? (
              <ChevronRight className="w-3 h-3 rotate-90" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <Folder className="w-3.5 h-3.5 text-yellow-500" />
            {node.name}
          </button>
          {isOpen && node.children?.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }
    return (
      <button
        key={node.path}
        onClick={() => openFile(node.path)}
        className={`flex items-center gap-1.5 w-full text-left py-1 px-2 rounded text-xs transition-colors ${
          selectedPath === node.path
            ? 'bg-brand-red-900/40 text-brand-red-300'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        <File className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-56 flex-shrink-0 border-r border-slate-800 overflow-y-auto py-2">
        {loading && !tree.length ? (
          <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPath ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 bg-slate-900 flex-shrink-0">
              <span className="text-xs font-mono text-slate-400 truncate flex-1">
                {selectedPath}
              </span>
              {isDirty && <span className="text-xs text-amber-400 font-semibold">● unsaved</span>}
              <button
                onClick={saveFile}
                disabled={saving || !isDirty}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  saveStatus === 'saved'
                    ? 'bg-green-700 text-white'
                    : saveStatus === 'error'
                      ? 'bg-red-700 text-white'
                      : 'bg-brand-red-600 hover:bg-brand-red-700 text-white disabled:opacity-40'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
              </button>
            </div>
            {/* Code editor */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <FolderOpen className="w-10 h-10 opacity-30" />
            <p className="text-sm">Select a file to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Website Tab ───────────────────────────────────────────────────────────────

const SITE_PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Programs', path: '/programs' },
  { label: 'HVAC', path: '/programs/hvac-technician' },
  { label: 'Apply (HVAC)', path: '/programs/hvac-technician/apply' },
  { label: 'Admin Dashboard', path: '/admin/dashboard' },
  { label: 'Admin Applications', path: '/admin/applications' },
  { label: 'Admin Enrollments', path: '/admin/enrollments' },
  { label: 'LMS Courses', path: '/lms/courses' },
];

function WebsiteTab() {
  const [url, setUrl] = useState('https://elevateforhumanity.org');
  const [inputUrl, setInputUrl] = useState('https://elevateforhumanity.org');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);

  function navigate(path: string) {
    const base = 'https://elevateforhumanity.org';
    const full = path.startsWith('http') ? path : `${base}${path}`;
    setUrl(full);
    setInputUrl(full);
    setKey((k) => k + 1);
  }

  function refresh() {
    setKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 flex-shrink-0">
        <button onClick={refresh} className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
          <RefreshCw className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(inputUrl)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-red-500"
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-md transition-colors ${viewport === 'desktop' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-md transition-colors ${viewport === 'mobile' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800 flex-wrap flex-shrink-0">
        {SITE_PAGES.map((p) => (
          <button
            key={p.path}
            onClick={() => navigate(p.path)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* iframe */}
      <div className="flex-1 overflow-hidden flex items-start justify-center bg-slate-800 p-4">
        <div
          className={`h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all ${
            viewport === 'mobile' ? 'w-[390px]' : 'w-full'
          }`}
        >
          <iframe key={key} src={url} className="w-full h-full border-0" title="Site preview" />
        </div>
      </div>
    </div>
  );
}
