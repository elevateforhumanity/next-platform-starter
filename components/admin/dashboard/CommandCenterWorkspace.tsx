'use client';

import { type ElementType, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  FileText,
  FolderOpen,
  Key,
  Loader2,
  MessageSquare,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Server,
  Sparkles,
  Terminal,
  Zap,
  Upload,
} from 'lucide-react';

interface WorkflowButton {
  key: string;
  label: string;
  description: string;
}

interface StudioConfig {
  workflowButtons?: WorkflowButton[];
  defaultPreviewUrl?: string;
  previewTargets?: { label: string; url: string }[];
}

interface CourseProgram {
  id: string;
  title: string;
  slug: string;
}

interface CourseBuilderProps {
  programs: CourseProgram[];
  embedded?: boolean;
  initialProgramId?: string;
}

type Workspace = 'studio' | 'deploy' | 'files' | 'environments' | 'services' | 'health' | 'secrets' | 'workflows';
type StudioMode = 'ask' | 'run' | 'courses';

const AIChat = dynamic(() => import('@/components/dev-studio/AIChat'), { ssr: false });
const DeployPanel = dynamic(() => import('@/components/dev-studio/DeployPanel'), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/dev-studio/ServicesPanel'), { ssr: false });
const PlatformTerminalPanel = dynamic(
  () => import('./PlatformTerminalPanel').then((m) => m.PlatformTerminalPanel),
  { ssr: false },
);
const WorkflowsOpsPanel = dynamic(
  () => import('./WorkflowsOpsPanel').then((m) => m.WorkflowsOpsPanel),
  { ssr: false },
);
const SecretsPanel = dynamic(() => import('@/components/dev-studio/SecretsPanel'), { ssr: false });
const AICourseBuilderChat = dynamic<CourseBuilderProps>(
  () => import('@/apps/admin/app/admin/courses/ai-builder/AICourseBuilderChat'),
  { ssr: false },
);
const WORKSPACES: { id: Workspace; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'studio', label: 'Studio', Icon: Bot },
  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'environments', label: 'Environments', Icon: Box },
  { id: 'services', label: 'Services', Icon: Server },
  { id: 'health', label: 'Health', Icon: Activity },
  { id: 'workflows', label: 'Workflows', Icon: Zap },
  { id: 'secrets', label: 'Secrets', Icon: Key },
];

const QUICK_ACTIONS = [
  { label: 'Website deploy', command: 'Deploy the LMS service' },
  { label: 'Admin deploy', command: 'Deploy the admin service' },
  { label: 'Studio deploy', command: 'Deploy the studio service' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'Build course', command: 'Generate a new course' },
  { label: 'System health', command: 'Check system health' },
];

function normalizeWorkspace(tab: string | null): { workspace: Workspace; mode: StudioMode } {
  if (tab === 'ellie') return { workspace: 'studio', mode: 'ask' };
  if (tab === 'deploy') return { workspace: 'deploy', mode: 'ask' };
  if (tab === 'files' || tab === 'git' || tab === 'docs' || tab === 'documents') return { workspace: 'files', mode: 'ask' };
  if (tab === 'container' || tab === 'environments') return { workspace: 'environments', mode: 'ask' };
  if (tab === 'services') return { workspace: 'services', mode: 'ask' };
  if (tab === 'health') return { workspace: 'health', mode: 'ask' };
  if (tab === 'secrets') return { workspace: 'secrets', mode: 'ask' };
  if (tab === 'workflows' || tab === 'workflow') return { workspace: 'workflows', mode: 'ask' };
  if (tab === 'command' || tab === 'terminal') return { workspace: 'studio', mode: 'run' };
  if (tab === 'courses' || tab === 'course') return { workspace: 'studio', mode: 'courses' };
  return { workspace: 'studio', mode: 'ask' };
}

export function CommandCenterWorkspace({
  isSuperAdmin = false,
  initialTab,
  onPreviewUrlDetected,
}: {
  isSuperAdmin?: boolean;
  initialTab?: string | null;
  onPreviewUrlDetected?: (url: string) => void;
}) {
  const searchParams = useSearchParams();
  const initial = normalizeWorkspace(initialTab ?? searchParams.get('tab'));
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace === 'secrets' && !isSuperAdmin ? 'studio' : initial.workspace);
  const [studioMode, setStudioMode] = useState<StudioMode>(initial.mode);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [programs, setPrograms] = useState<CourseProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  const tabParam = searchParams.get('tab');

  useEffect(() => {
    const next = normalizeWorkspace(initialTab ?? tabParam);
    setWorkspace(next.workspace === 'secrets' && !isSuperAdmin ? 'studio' : next.workspace);
    setStudioMode(next.mode);
  }, [tabParam, initialTab, isSuperAdmin]);

  useEffect(() => {
    fetch('/api/admin/devstudio/config')
      .then((r) => r.json())
      .then((data: StudioConfig) => setConfig(data))
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    setProgramsLoading(true);
    fetch('/api/admin/programs?status=active')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((payload) => {
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setPrograms(rows.map((program: { id: string; title?: string; name?: string; slug?: string; code?: string }) => ({
          id: program.id,
          title: program.title ?? program.name ?? program.code ?? 'Untitled program',
          slug: program.slug ?? program.code ?? program.id,
        })));
      })
      .catch(() => setPrograms([]))
      .finally(() => setProgramsLoading(false));
  }, []);


  function openWorkspace(next: Workspace) {
    if (next === 'secrets' && !isSuperAdmin) {
      setWorkspace('health');
      return;
    }
    setWorkspace(next);
  }

  const visibleWorkspaces = WORKSPACES.filter((item) => item.id !== 'secrets' || isSuperAdmin);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <div className="shrink-0 border-b border-[#3c3c3c] bg-[#1a2e1a] px-3 py-1.5 text-[10px] leading-snug text-[#9ca3af]">
        <strong className="text-[#4ec9b0]">Platform command center</strong>
        {' '}
        — public site, LMS, enrollments, workflows, deploy, and container shell. Preview below updates when the shell prints a local dev URL.
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[#3c3c3c] bg-[#252526] px-2 py-1.5">
        {visibleWorkspaces.map(({ id, label, Icon }) => {
          const active = workspace === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => openWorkspace(id)}
              className="inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium transition"
              style={{
                borderColor: active ? '#0078d4' : '#3c3c3c',
                background: active ? '#094771' : 'transparent',
                color: active ? '#ffffff' : '#cccccc',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
        {workspace === 'studio' && (
          <span className="ml-auto flex gap-1">
            {(
              [
                { id: 'ask' as StudioMode, label: 'Ask' },
                { id: 'run' as StudioMode, label: 'Run' },
                { id: 'courses' as StudioMode, label: 'Courses' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStudioMode(id)}
                className="rounded border px-2 py-0.5 text-[10px]"
                style={{
                  borderColor: studioMode === id ? '#f97316' : '#3c3c3c',
                  background: studioMode === id ? '#7c2d12' : 'transparent',
                  color: '#fff',
                }}
              >
                {label}
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
                      {workspace === 'studio' && (
              <StudioPanel
                mode={studioMode}
                onModeChange={setStudioMode}
                programs={programs}
                programsLoading={programsLoading}
                onPreviewUrlDetected={onPreviewUrlDetected}
              />
            )}
            {workspace === 'deploy' && <DeployPanel workflowButtons={config?.workflowButtons} />}
            {workspace === 'files' && <FilesPanel />}
            {workspace === 'environments' && <EnvironmentPanel />}
            {workspace === 'services' && <ServicesPanel />}
            {workspace === 'health' && <HealthPanel health={health} onRefresh={() => window.location.reload()} />}
            {workspace === 'workflows' && <WorkflowsOpsPanel />}
            {workspace === 'secrets' && (isSuperAdmin ? <SecretsPanel /> : <HealthPanel health={health} onRefresh={() => window.location.reload()} />)}
      </div>
    </div>
  );
}

function StudioPanel({
  mode,
  onModeChange,
  programs,
  programsLoading,
  onPreviewUrlDetected,
}: {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  programs: CourseProgram[];
  programsLoading: boolean;
  onPreviewUrlDetected?: (url: string) => void;
}) {
  const modes: { id: StudioMode; label: string; Icon: ElementType<{ className?: string }> }[] = [
    { id: 'ask', label: 'Ask', Icon: MessageSquare },
    { id: 'run', label: 'Shell', Icon: Terminal },
    { id: 'courses', label: 'Courses', Icon: BookOpen },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[#3c3c3c] bg-[#252526] px-2">
        {modes.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            className="inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[11px]"
            style={{ borderColor: mode === id ? '#0078d4' : '#3c3c3c', background: mode === id ? '#094771' : 'transparent', color: '#ffffff' }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === 'ask' && <AIChat ellieMode={true} />}
        {mode === 'run' && <PlatformTerminalPanel onPreviewUrlDetected={onPreviewUrlDetected} />}
        {mode === 'courses' && (
          programsLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">Loading active programs...</span>
            </div>
          ) : (
            <AICourseBuilderChat programs={programs} embedded />
          )
        )}
      </div>
    </div>
  );
}


const MAX_UPLOAD_BYTES = 512 * 1024;
const TEXT_UPLOAD_EXTENSIONS = new Set([
  'css',
  'csv',
  'html',
  'js',
  'jsx',
  'json',
  'md',
  'mdx',
  'mjs',
  'sql',
  'svg',
  'ts',
  'tsx',
  'txt',
  'xml',
  'yml',
  'yaml',
]);

function sanitizeUploadPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/')
    .trim();
}

function isEditableUpload(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (TEXT_UPLOAD_EXTENSIONS.has(ext)) return true;
  if (file.type.startsWith('text/')) return true;
  return ['application/json', 'application/xml', 'image/svg+xml'].includes(file.type);
}

function FilesPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState('');
  const [sha, setSha] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadPath, setUploadPath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/devstudio/files');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const flat: string[] = [];
      function walk(nodes: { type: string; path: string; children?: unknown[] }[]) {
        for (const node of nodes ?? []) {
          if (node.type === 'file') flat.push(node.path);
          else walk((node.children ?? []) as { type: string; path: string; children?: unknown[] }[]);
        }
      }
      walk(data.tree ?? []);
      setFiles(flat);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'File tree unavailable');
    }
  }, []);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setStatus('');

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus(`Upload exceeds ${MAX_UPLOAD_BYTES / 1024} KB edit limit`);
      return;
    }

    if (!isEditableUpload(file)) {
      setStatus('Upload is not a text/code file');
      return;
    }

    try {
      const nextPath = sanitizeUploadPath(uploadPath || `devstudio-uploads/${file.name}`);
      if (!nextPath) throw new Error('Upload path is required');
      const text = await file.text();
      setSelected(nextPath);
      setUploadPath(nextPath);
      setContent(text);
      setSha('');
      setMessage(`chore: add ${nextPath} via Dev Studio`);
      setStatus('Ready to commit upload');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read upload');
    }
  }

  async function loadFile(path: string) {
    setSelected(path);
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`/api/devstudio/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setContent(data.content ?? '');
      setSha(data.sha ?? '');
      setUploadPath('');
      setMessage(`chore: update ${path} via Dev Studio`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load file');
    } finally {
      setLoading(false);
    }
  }

  async function saveFile() {
    if (!selected) return;
    setLoading(true);
    setStatus('');
    try {
      const method = sha ? 'PUT' : 'POST';
      const res = await fetch('/api/devstudio/files', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selected, content, sha: sha || undefined, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSha(data.sha ?? sha);
      setStatus(data.commit ? 'Committed' : method === 'POST' ? 'Uploaded' : 'Saved');
      if (method === 'POST') {
        setFiles((current) => (current.includes(selected) ? current : [...current, selected].sort()));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save file');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#1e1e1e]">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-[#3c3c3c] bg-[#252526]">
        <div className="sticky top-0 border-b border-[#3c3c3c] bg-[#252526] p-2">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#858585]">Files</div>
          <div className="flex gap-1">
            <input
              value={uploadPath}
              onChange={(event) => {
                const nextPath = sanitizeUploadPath(event.target.value);
                setUploadPath(nextPath);
                if (!sha && selected) {
                  setSelected(nextPath);
                  setMessage(`chore: add ${nextPath} via Dev Studio`);
                }
              }}
              className="h-8 min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 font-mono text-[11px] text-[#cccccc] outline-none"
              placeholder="devstudio-uploads/file.ts"
              spellCheck={false}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".css,.csv,.html,.js,.jsx,.json,.md,.mdx,.mjs,.sql,.svg,.ts,.tsx,.txt,.xml,.yml,.yaml,text/*,application/json,application/xml,image/svg+xml"
              onChange={(event) => {
                void handleUpload(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#0078d4] text-white"
              title="Upload file"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {files.map((file) => (
          <button
            key={file}
            type="button"
            onClick={() => loadFile(file)}
            className="flex w-full items-center gap-2 border-b border-[#2d2d2d] px-3 py-2 text-left text-[11px]"
            style={{ background: selected === file ? '#094771' : 'transparent', color: selected === file ? '#ffffff' : '#cccccc' }}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file}</span>
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#858585]">{selected || 'Select a file'}</span>
          {status && <span className="text-[11px] text-[#4ec9b0]">{status}</span>}
          <button
            type="button"
            onClick={saveFile}
            disabled={!selected || loading}
            className="inline-flex h-8 items-center gap-1 rounded bg-[#f97316] px-2 text-[11px] font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Commit
          </button>
        </div>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="h-9 shrink-0 border-b border-[#3c3c3c] bg-[#252526] px-3 font-mono text-[11px] text-[#cccccc] outline-none"
          placeholder="Commit message"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-0 flex-1 resize-none bg-[#1e1e1e] p-3 font-mono text-xs text-[#cccccc] outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function EnvironmentPanel() {
  return (
    <div className="h-full overflow-hidden bg-white">
      <DevContainerPanel />
    </div>
  );
}

function HealthPanel({ health, onRefresh }: { health: Record<string, unknown> | null; onRefresh: () => void }) {
  const rows = [
    ['GitHub', health?.hasGitHub ? 'connected' : 'not connected'],
    ['Groq', health?.hasGroq ? 'configured' : 'missing'],
    ['Gemini', health?.hasGemini ? 'configured' : 'missing'],
    ['OpenAI', health?.hasOpenAI ? 'configured' : 'missing'],
    ['Supabase URL', health?.supabaseUrlPresent ? 'present' : 'missing'],
    ['Supabase service key', health?.supabaseServiceKeyPresent ? 'present' : 'missing'],
    ['Node', String(health?.nodeVersion ?? 'unknown')],
    ['Next', String(health?.nextVersion ?? 'unknown')],
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#1e1e1e] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#4ec9b0]" />
          <h2 className="text-sm font-semibold text-white">Health</h2>
        </div>
        <button type="button" onClick={onRefresh} className="inline-flex h-8 items-center gap-1 rounded border border-[#3c3c3c] px-2 text-[11px] text-[#cccccc]">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <div className="rounded border border-[#3c3c3c] bg-[#252526]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-[#2d2d2d] px-3 py-2 text-xs last:border-0">
            <span className="text-[#858585]">{label}</span>
            <span className="font-mono text-[#cccccc]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
