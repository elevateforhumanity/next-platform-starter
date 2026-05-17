'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Sparkles, MessageSquare, Terminal, FolderOpen, Globe, Box,
  Send, Loader2, RefreshCw, ExternalLink, Save,
  ChevronRight, File, Folder, Monitor, Smartphone, Play, X, Circle,
  PanelRightClose, PanelRightOpen, AlertTriangle, Key,
} from 'lucide-react';

import type { default as CodeEditorType } from '@/components/dev-studio/CodeEditor';

const XTerminal         = dynamic(() => import('@/components/dev-studio/XTerminal'),         { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const DocumentsPanel    = dynamic(() => import('@/components/dev-studio/DocumentsPanel'),    { ssr: false });
const AIChat            = dynamic(() => import('@/components/dev-studio/AIChat'),            { ssr: false });
const EcsStatusPanel    = dynamic(() => import('@/components/dev-studio/EcsStatusPanel'),    { ssr: false });
const FileTree          = dynamic(() => import('@/components/dev-studio/FileTree'),          { ssr: false });
const PreviewPanel      = dynamic(() => import('@/components/dev-studio/PreviewPanel'),      { ssr: false });
const SecretsPanel      = dynamic(() => import('@/components/dev-studio/SecretsPanel'),      { ssr: false });
const CodeEditor        = dynamic<React.ComponentProps<typeof CodeEditorType>>(
  () => import('@/components/dev-studio/CodeEditor'),
  { ssr: false },
);

type Tab = 'command' | 'terminal' | 'files' | 'website' | 'container' | 'chat' | 'documents' | 'secrets';
interface FileNode { name: string; path: string; type: 'file' | 'directory'; children?: FileNode[]; }
type WorkflowKey = 'deploy-lms' | 'deploy-admin' | 'ci' | 'lint';
interface DevStudioConfig {
  quickCommands?: string[];
  workflowButtons?: { key: WorkflowKey; label: string; description: string }[];
  defaultPreviewUrl?: string;
  previewTargets?: { label: string; url: string }[];
  tabFiles?: Partial<Record<Tab, string>>;
}

interface DevStudioHealth {
  hasGroq: boolean;
  hasGemini: boolean;
  hasOpenAI: boolean;
  hasGitHub: boolean;
}

const TABS: { id: Tab; Icon: React.ElementType<{ className?: string }>; label: string }[] = [
  { id: 'command',   Icon: Sparkles,      label: 'Command'   },
  { id: 'chat',      Icon: MessageSquare, label: 'AI Chat'   },
  { id: 'terminal',  Icon: Terminal,      label: 'Terminal'  },
  { id: 'files',     Icon: FolderOpen,    label: 'Explorer'  },
  { id: 'website',   Icon: Globe,         label: 'Preview'   },
  { id: 'container', Icon: Box,           label: 'Container' },
  { id: 'documents', Icon: FolderOpen,    label: 'Documents' },
  { id: 'secrets',   Icon: Key,           label: 'Secrets'   },
];

const DEFAULT_TAB_FILES: Record<Tab, string> = {
  command: 'command.sh', chat: 'ai-chat.md', terminal: 'terminal.sh',
  files: 'explorer', website: 'preview.html', container: 'devcontainer.json',
  documents: 'documents', secrets: 'platform-secrets',
};

// ── Embed-check hook ─────────────────────────────────────────────────────────
// Calls the server-side /api/devstudio/embed-check endpoint which HEAD-fetches
// the target URL and inspects X-Frame-Options / CSP frame-ancestors headers.
// Returns { embeddable: boolean | null (pending), reason?: string }
function useEmbedCheck(url: string) {
  const [state, setState] = useState<{ embeddable: boolean | null; reason?: string }>({ embeddable: null });
  useEffect(() => {
    if (!url) return;
    setState({ embeddable: null });
    const controller = new AbortController();
    fetch(`/api/devstudio/embed-check?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { embeddable: boolean; reason?: string }) => setState(d))
      .catch(() => setState({ embeddable: true })); // on network error, let iframe try
    return () => controller.abort();
  }, [url]);
  return state;
}

// ── IframePreview ─────────────────────────────────────────────────────────────
// Renders an iframe when embeddable, or a blocked-state UI with an open-in-tab
// escape hatch when the target sends X-Frame-Options / CSP frame-ancestors.
function IframePreview({
  url,
  title = 'Preview',
  style,
  className,
}: {
  url: string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { embeddable, reason } = useEmbedCheck(url);
  const [loading, setLoading] = useState(true);

  // Reset loading spinner whenever url changes
  useEffect(() => { setLoading(true); }, [url]);

  if (embeddable === null) {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className ?? ''}`} style={style}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#858585' }} />
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 w-full h-full text-center px-6 ${className ?? ''}`}
        style={{ background: '#1e1e1e', ...style }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: '#f0a500' }} />
        <p className="text-sm font-medium" style={{ color: '#cccccc' }}>
          This page can&apos;t be embedded
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: '#858585' }}>
          The server returned <code className="px-1 rounded" style={{ background: '#2d2d2d', color: '#4ec9b0' }}>{reason}</code>
          {' '}which blocks iframe embedding.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{ background: '#0078d4', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#005fa3')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0078d4')}
        >
          <ExternalLink className="w-4 h-4" />
          Open in new tab
        </a>
        <p className="text-[10px]" style={{ color: '#555' }}>
          Or use a local dev server URL (e.g. http://localhost:3000) in the address bar above.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className ?? ''}`} style={style}>
      {loading && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center h-8 z-10 border-b"
          style={{ background: 'rgba(30,30,30,0.85)', borderColor: '#3c3c3c' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#858585' }} />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        title={title}
      />
    </div>
  );
}

export default function DevStudioClient() {
  const searchParams = useSearchParams();
  const raw = searchParams.get('tab') as Tab | null;
  const initialCommand = searchParams.get('command') ?? '';
  const valid: Tab[] = ['command','terminal','files','website','container','chat','documents','secrets'];
  const init: Tab = raw && valid.includes(raw) ? raw : (initialCommand ? 'command' : 'command');
  const [tab, setTab] = useState<Tab>(init);
  const [openTabs, setOpenTabs] = useState<Tab[]>([init]);
  const [studioConfig, setStudioConfig] = useState<DevStudioConfig | null>(null);
  const [configLoadError, setConfigLoadError] = useState(false);
  const [studioHealth, setStudioHealth] = useState<DevStudioHealth | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1280);

  // Breakpoints: phone < 640, tablet 640–1023, desktop >= 1024
  const isPhone   = viewportWidth < 640;
  const isCompactLayout = viewportWidth < 1024;

  // Preview hidden by default on phone — too little vertical space
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(420); // px
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = previewWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [previewWidth]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX; // dragging left = wider preview
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth;
      const minWidth = 280;
      const maxWidth = Math.max(minWidth, containerW - 400);
      const next = Math.min(Math.max(dragStartW.current + delta, minWidth), maxWidth);
      setPreviewWidth(next);
    }
    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      // Auto-close preview when resizing down to phone; auto-open on desktop
      if (w >= 1024) setPreviewOpen(true);
      if (w < 640)   setPreviewOpen(false);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  useEffect(() => {
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStudioHealth(d))
      .catch(() => setStudioHealth(null));
  }, []);

  const tabFiles = { ...DEFAULT_TAB_FILES, ...(studioConfig?.tabFiles ?? {}) } as Record<Tab, string>;
  // Prefer config value; fall back to current origin so the preview always shows something useful
  const previewUrl = studioConfig?.defaultPreviewUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const hasAnyAI = !!(studioHealth?.hasGroq || studioHealth?.hasGemini || studioHealth?.hasOpenAI);

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
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden"
      style={{
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
        background: '#1e1e1e',
        color: '#cccccc',
        // layout.tsx uses position:fixed with top:64 so this div fills
        // the fixed container — no paddingTop needed here.
        height: '100%',
        width: '100%',
      }}
    >
      {/* ── Title / menu bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 sm:px-3 border-b text-xs select-none"
        style={{ background: '#323233', borderColor: '#3c3c3c', color: '#cccccc', minHeight: isPhone ? 44 : 28 }}>
        <span className="font-bold text-white mr-2 text-[11px]">Dev Studio</span>
        {/* Menu items hidden on phone — no room */}
        {!isPhone && ['File','Edit','View','Terminal','Help'].map((m) => (
          <span key={m} className="hidden sm:inline cursor-pointer px-2 py-0.5 rounded text-[11px] transition-colors" style={{ color: '#cccccc' }}
            onMouseEnter={e => (e.currentTarget.style.background='#3c3c3c')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>{m}</span>
        ))}
        <div className="ml-auto flex items-center gap-2 sm:gap-3 text-[11px]" style={{ color: '#858585' }}>
          <span className="flex items-center gap-1" style={{ color: '#4ec9b0' }}>
            <Circle className="w-2 h-2 fill-current" /> main
          </span>
          {studioHealth && (
            <>
              <span
                className="hidden md:inline px-1.5 py-0.5 rounded border"
                style={{
                  color: studioHealth.hasGitHub ? '#4ec9b0' : '#fca5a5',
                  borderColor: studioHealth.hasGitHub ? '#4ec9b0' : '#fca5a5',
                }}
              >
                {studioHealth.hasGitHub ? 'GitHub Connected' : 'GitHub Not Connected'}
              </span>
              <span
                className="hidden md:inline px-1.5 py-0.5 rounded border"
                style={{
                  color: hasAnyAI ? '#4ec9b0' : '#f0a500',
                  borderColor: hasAnyAI ? '#4ec9b0' : '#f0a500',
                }}
              >
                {hasAnyAI ? 'English Commands Ready' : 'Enable AI Key For English Commands'}
              </span>
            </>
          )}
          <span className="hidden sm:inline">Elevate LMS</span>
          {/* Preview toggle — larger tap target on phone */}
          <button
            title={previewOpen ? 'Hide live preview' : 'Show live preview'}
            onClick={() => setPreviewOpen((v) => !v)}
            className="flex items-center gap-1 px-2 rounded text-[11px] transition-colors"
            style={{
              color: previewOpen ? '#4ec9b0' : '#858585',
              minHeight: isPhone ? 44 : undefined,
              minWidth: isPhone ? 44 : undefined,
              justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.background='#3c3c3c')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}
          >
            {previewOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            <span className="hidden sm:inline ml-1">Preview</span>
          </button>
        </div>
      </div>

      {configLoadError && (
        <div className="flex-shrink-0 px-3 py-1 text-[11px] border-b" style={{ background: '#5a4a00', borderColor: '#6e5c00', color: '#ffd700' }}>
          Studio config could not be loaded — using defaults.
        </div>
      )}

      {/* ── Tab strip ── */}
      <div className="flex-shrink-0 flex items-end overflow-x-auto border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c', scrollbarWidth: 'none' }}>
        {openTabs.map((t) => {
          const def = TABS.find((x) => x.id === t)!;
          const active = tab === t;
          return (
            <button key={t} onClick={() => openTab(t)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0 group transition-colors border-r"
              style={{
                background:  active ? '#1e1e1e' : 'transparent',
                color:       active ? '#ffffff' : '#858585',
                borderColor: '#3c3c3c',
                borderTop:   active ? '1px solid #0078d4' : '1px solid transparent',
                // Minimum 44px touch target height on phone
                minHeight: isPhone ? 44 : undefined,
              }}>
              <def.Icon className="w-3.5 h-3.5" style={{ opacity: active ? 1 : 0.5 }} />
              {/* Hide filename label on phone — icon is enough */}
              {!isPhone && <span>{tabFiles[t]}</span>}
              {/* Close button: larger tap area on phone */}
              <span
                onClick={(e) => closeTab(t, e)}
                className={`rounded transition-opacity ${isPhone ? 'ml-1 p-1 opacity-60' : 'ml-1.5 p-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100'}`}
                style={{ color: '#cccccc' }}>
                <X className={isPhone ? 'w-4 h-4' : 'w-3 h-3'} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Body: activity bar | editor | resizer | live preview ── */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${isCompactLayout ? 'flex-col' : 'flex-row'}`}>

        {/* Activity bar */}
        <div
          className={`flex-shrink-0 flex ${isCompactLayout ? 'flex-row w-full px-1 py-1 gap-0.5 overflow-x-auto border-b' : 'flex-col items-center py-2 gap-0.5 w-12 border-r'}`}
          style={{ background: '#333333', borderColor: '#3c3c3c' }}
        >
          {TABS.map(({ id, Icon, label }) => {
            const active = tab === id;
            // Phone: 44×44 touch target (WCAG 2.5.5); tablet: 36×36; desktop: 40×40
            const btnSize = isPhone ? 'w-11 h-11 flex-shrink-0' : isCompactLayout ? 'w-9 h-9 flex-shrink-0' : 'w-10 h-10';
            return (
              <button key={id} title={label} onClick={() => openTab(id)}
                className={`relative flex items-center justify-center rounded transition-colors ${btnSize}`}
                style={{ color: active ? '#ffffff' : '#858585' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#cccccc'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#858585'; }}>
                {active && (
                  <span
                    className={isCompactLayout ? 'absolute inset-x-2 bottom-0 h-0.5 rounded-t' : 'absolute left-0 top-2 bottom-2 w-0.5 rounded-r'}
                    style={{ background: '#0078d4' }}
                  />
                )}
                <Icon className={isPhone ? 'w-6 h-6' : 'w-5 h-5'} />
              </button>
            );
          })}
        </div>

        {/* Editor area */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ background: '#1e1e1e' }}>
          {tab === 'command'   && <CommandTab quickCommands={studioConfig?.quickCommands} initialCommand={initialCommand} />}
          {tab === 'chat'      && <AIChat />}
          {tab === 'terminal'  && <TerminalTab workflowButtons={studioConfig?.workflowButtons} />}
          {tab === 'files'     && <FilesTab />}
          {tab === 'website'   && <WebsiteTab config={studioConfig} />}
          {tab === 'container' && <ContainerTab />}
          {tab === 'documents' && <DocumentsPanel />}
          {tab === 'secrets'   && <SecretsPanel />}
        </div>

        {/* Drag-to-resize handle */}
        {previewOpen && !isCompactLayout && (
          <div
            onMouseDown={onResizerMouseDown}
            className="flex-shrink-0 w-1 cursor-col-resize transition-colors"
            style={{ background: '#3c3c3c' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0078d4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3c3c3c')}
          />
        )}

        {/* Live preview panel — always mounted, hidden when closed */}
        {previewOpen && (
          <div
            className={`flex-shrink-0 flex flex-col overflow-hidden ${isCompactLayout ? 'border-t' : 'border-l'}`}
            style={{
              width: isCompactLayout ? '100%' : previewWidth,
              // Phone: 35dvh keeps enough room for the editor above
              // Tablet: 40dvh gives a reasonable split
              // Desktop: fixed pixel width (side-by-side)
              height: isPhone ? '35dvh' : isCompactLayout ? '40dvh' : undefined,
              minHeight: isPhone ? 180 : isCompactLayout ? 220 : undefined,
              background: '#1e1e1e',
              borderColor: '#3c3c3c',
            }}
          >
            {/* Preview panel header */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border-b text-[11px] select-none" style={{ background: '#2d2d2d', borderColor: '#3c3c3c', color: '#858585' }}>
              <Globe className="w-3.5 h-3.5" style={{ color: '#4ec9b0' }} />
              <span style={{ color: '#cccccc' }}>Live Preview</span>
              <span className="ml-auto opacity-60 truncate max-w-[140px]">{previewUrl}</span>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab"
                className="p-0.5 rounded transition-colors"
                style={{ color: '#858585' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button title="Close preview" onClick={() => setPreviewOpen(false)}
                className="p-0.5 rounded transition-colors"
                style={{ color: '#858585' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* iframe — embed-check aware */}
            <div className="flex-1 overflow-hidden" style={{ background: '#1e1e1e' }}>
              <IframePreview url={previewUrl} title="Live Preview" />
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-3 py-0.5 text-white text-[11px] select-none" style={{ background: '#0078d4' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">⎇ main</span>
          <span className="hidden sm:inline opacity-80">Elevate LMS · Dev Container</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 opacity-80">
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

function CommandTab({ quickCommands, initialCommand }: { quickCommands?: string[]; initialCommand?: string }) {
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

  useEffect(() => {
    if (!initialCommand) return;
    setInput(initialCommand);
  }, [initialCommand]);

  // quickCommands comes from /api/admin/devstudio/config (platform_settings DB row).
  // The config API owns the fallback list — no duplicate here.
  const QUICK = quickCommands ?? [];

  const QUICK_ACTIONS = [
    { label: 'Analytics',        cmd: 'Get platform analytics overview' },
    { label: 'Applications',     cmd: 'List pending applications' },
    { label: 'Students',         cmd: 'List recent students' },
    { label: 'Enrollments',      cmd: 'List recent enrollments' },
    { label: 'Programs',         cmd: 'List all published programs' },
    { label: 'WIOA cases',       cmd: 'List pending WIOA cases' },
    { label: 'Payout queue',     cmd: 'List payout queue' },
    { label: 'System health',    cmd: 'Check system health' },
    { label: 'Daily report',     cmd: 'Run overall report' },
    { label: 'Enrollment report',cmd: 'Run enrollment report' },
    { label: 'Financial report', cmd: 'Run financial report' },
    { label: 'WIOA report',      cmd: 'Run WIOA report' },
    { label: 'Run payroll',      cmd: 'Run payroll' },
    { label: 'Export payroll',   cmd: 'Export payroll' },
    { label: 'Recent commits',   cmd: 'Show recent commits' },
    { label: 'Signing commits',  cmd: 'Show commits for components/SignaturePad.tsx' },
    { label: 'Export students',  cmd: 'Export students CSV' },
  ];

  const AUTOPILOT = [
    { label: '🏗 Build courses',  cmd: 'Build all courses and push to GitHub' },
    { label: '🚀 Deploy LMS',     cmd: 'Deploy the LMS service' },
    { label: '🚀 Deploy Admin',   cmd: 'Deploy the admin service' },
    { label: '🧪 Smoke test',     cmd: 'Run smoke test' },
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

    // Smoke test bypasses the AI round-trip — call the endpoint directly
    const isSmokeTest = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(cmd);

    try {
      const res = await fetch(
        isSmokeTest ? '/api/devstudio/smoke-test' : '/api/devstudio/execute',
        isSmokeTest
          ? { signal: abortRef.current.signal }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: cmd }),
              signal: abortRef.current.signal,
            },
      );

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

        <div className="flex-shrink-0 px-3 py-1.5 border-b border-blue-100 bg-blue-50 text-[11px] text-blue-700">
          Use plain English commands: "Generate a CNA course", "Run enrollment report", "Deploy LMS".
        </div>

        {/* Quick action buttons — single scrollable row, no wrapping */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5 px-2.5 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {QUICK_ACTIONS.map(({ label, cmd }) => (
              <button key={label} onClick={() => run(cmd)} disabled={loading}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] rounded-md border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-700 disabled:opacity-40 transition-colors shadow-sm whitespace-nowrap">
                {label}
              </button>
            ))}
          </div>
          {/* Autopilot — single scrollable row */}
          <div className="flex items-center gap-1.5 px-2.5 pb-2 border-t border-slate-100 pt-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="flex-shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autopilot</span>
            {AUTOPILOT.map(({ label, cmd }) => (
              <button key={label} onClick={() => run(cmd)} disabled={loading}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 text-blue-700 disabled:opacity-40 transition-colors shadow-sm whitespace-nowrap">
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
          <div className="flex gap-2 items-center">
            <span className="text-orange-500 font-mono text-sm font-bold">$</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(input); } }}
              placeholder="Tell it what to do… e.g. 'Run enrollment report', 'Generate a CNA course', 'List at-risk students'"
              disabled={loading}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400 font-mono h-10 disabled:opacity-60"
            />
            <button onClick={() => run(input)} disabled={loading || !input.trim()}
              className="p-2 rounded-md bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-colors h-10 w-10 inline-flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Enter to run · Output persists across page reloads</p>
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
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Workflow buttons */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 px-4 py-3 border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c' }}>
        {(workflowButtons && workflowButtons.length > 0 ? workflowButtons : WORKFLOW_BUTTONS).map(({ key, label, description }) => (
          <button key={key} onClick={() => dispatch(key)} disabled={!!loading}
            title={description}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md border disabled:opacity-50 transition-colors"
            style={{ background: '#3c3c3c', borderColor: '#555', color: '#cccccc' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#4a4a4a'; e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3c3c3c'; e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#cccccc'; }}>
            {loading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {label}
          </button>
        ))}
        {activeRun && (
          <a href={activeRun.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md transition-colors"
            style={{ background: '#3c3c3c', color: '#858585' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
            onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
            <ExternalLink className="w-3 h-3" />
            {activeRun.status === 'completed'
              ? `${activeRun.conclusion ?? 'done'}`
              : activeRun.status}
          </a>
        )}
      </div>
      {/* Real xterm.js terminal — WebSocket → studio-shell ECS container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <XTerminal />
      </div>
    </div>
  );
}
// ── Files Tab ────────────────────────────────────────────────────────────────

// ── ContainerTab ─────────────────────────────────────────────────────────────
function ContainerTab() {
  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto p-2">
      <EcsStatusPanel />
      <DevContainerPanel />
    </div>
  );
}

function FilesTab() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [commitMsg, setCommitMsg] = useState('');

  useEffect(() => {
    fetch('/api/devstudio/files')
      .then((r) => r.json())
      .then((d) => {
        // Flatten tree to path list for FileTree component
        const flat: string[] = [];
        function walk(nodes: any[]) {
          for (const n of nodes ?? []) {
            if (n.type === 'file') flat.push(n.path);
            else walk(n.children ?? []);
          }
        }
        walk(d.tree ?? []);
        setFiles(flat);
      })
      .catch(() => {});
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
        if (d.sha) setFileSha(d.sha);
        setSaveMsg(d.commit ? '✅ Committed' : '✅ Saved');
        setTimeout(() => setSaveMsg(''), 4000);
      }
    } catch {
      setSaveMsg('❌ Request failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-white">
      {/* Sidebar — FileTree component */}
      <div className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50 max-h-48 md:max-h-none">
        <FileTree
          files={files}
          onFileSelect={loadFile}
          selectedFile={selected ?? undefined}
        />
      </div>
      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selected ? (
          <>
            <div className="flex-shrink-0 flex flex-col gap-1 px-4 py-1.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-mono truncate max-w-xs">{selected}</span>
                {saveMsg && <span className="text-[11px] text-slate-600">{saveMsg}</span>}
                <button onClick={saveFile} disabled={saving || !fileSha}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-colors">
                  <Save className="w-2.5 h-2.5" />{saving ? 'Committing…' : 'Commit'}
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
              <CodeEditor value={content} onChange={(val) => setContent(val)} filePath={selected} />
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
  // Prefer config value (from platform_settings DB row or env-driven fallback in config API).
  // Use current origin as last resort so the iframe always has something to show.
  const defaultUrl = config?.defaultPreviewUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const targets = config?.previewTargets ?? [];
  const [url, setUrl] = useState(defaultUrl);
  const [input, setInput] = useState(defaultUrl);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Sync default URL when config loads
  useEffect(() => {
    if (!config?.defaultPreviewUrl) return;
    setUrl(config.defaultPreviewUrl);
    setInput(config.defaultPreviewUrl);
  }, [config?.defaultPreviewUrl]);

  function navigate(next: string) {
    setInput(next);
    setUrl(next);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      {/* Browser chrome */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c' }}>
        <button onClick={() => setViewport('desktop')} title="Desktop"
          className="p-1.5 rounded transition-colors"
          style={{ background: viewport === 'desktop' ? '#0078d4' : 'transparent', color: viewport === 'desktop' ? '#fff' : '#858585' }}
          onMouseEnter={e => { if (viewport !== 'desktop') e.currentTarget.style.color = '#cccccc'; }}
          onMouseLeave={e => { if (viewport !== 'desktop') e.currentTarget.style.color = '#858585'; }}>
          <Monitor className="w-4 h-4" />
        </button>
        <button onClick={() => setViewport('mobile')} title="Mobile"
          className="p-1.5 rounded transition-colors"
          style={{ background: viewport === 'mobile' ? '#0078d4' : 'transparent', color: viewport === 'mobile' ? '#fff' : '#858585' }}
          onMouseEnter={e => { if (viewport !== 'mobile') e.currentTarget.style.color = '#cccccc'; }}
          onMouseLeave={e => { if (viewport !== 'mobile') e.currentTarget.style.color = '#858585'; }}>
          <Smartphone className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded px-3 py-1 border" style={{ background: '#3c3c3c', borderColor: '#555' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(input)}
            className="flex-1 bg-transparent text-xs outline-none font-mono"
            style={{ color: '#cccccc' }}
          />
        </div>
        <button onClick={() => navigate(input)} title="Reload"
          className="p-1.5 rounded transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
          onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
          <RefreshCw className="w-4 h-4" />
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab"
          className="p-1.5 rounded transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
          onMouseLeave={e => (e.currentTarget.style.color = '#858585')}>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {targets.length > 0 && (
        <div className="flex-shrink-0 flex flex-wrap gap-2 px-3 py-2 border-b" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          {targets.map((t) => (
            <button
              key={t.label}
              onClick={() => navigate(t.url)}
              className="px-2 py-1 text-[11px] rounded border transition-colors"
              style={{ borderColor: '#555', color: '#858585', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.color = '#cccccc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#858585'; }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Viewport */}
      <div className="flex-1 min-h-0">
        <PreviewPanel url={url} />
      </div>
    </div>
  );
}
