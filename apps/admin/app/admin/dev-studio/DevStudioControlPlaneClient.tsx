'use client';

import { type ElementType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  ExternalLink,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
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
  Upload,
  Workflow,
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

type Workspace =
  | 'ellie'
  | 'deploy'
  | 'files'
  | 'git'
  | 'terminal'
  | 'environments'
  | 'services'
  | 'health'
  | 'secrets';
type StudioMode = 'ask' | 'run' | 'courses';

const AIChat = dynamic(() => import('@/components/dev-studio/AIChat'), { ssr: false });
const DeployPanel = dynamic(() => import('@/components/dev-studio/DeployPanel'), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/dev-studio/ServicesPanel'), { ssr: false });
const SecretsPanel = dynamic(() => import('@/components/dev-studio/SecretsPanel'), { ssr: false });
const GitPanel = dynamic(() => import('@/components/dev-studio/GitPanel'), { ssr: false });
const XTerminal = dynamic(() => import('@/components/dev-studio/XTerminal'), { ssr: false });
const EcsStatusPanel = dynamic(() => import('@/components/dev-studio/EcsStatusPanel'), { ssr: false });
const ColoredLivePreviewFrame = dynamic(
  () => import('@/components/admin/dashboard/ColoredLivePreviewFrame').then((m) => m.ColoredLivePreviewFrame),
  { ssr: false },
);
const AICourseBuilderChat = dynamic<CourseBuilderProps>(
  () => import('../courses/ai-builder/AICourseBuilderChat'),
  { ssr: false },
);

const WORKSPACES: { id: Workspace; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'ellie', label: 'Ellie', Icon: Bot },
  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'git', label: 'Git', Icon: GitBranch },
  { id: 'terminal', label: 'Terminal', Icon: Terminal },
  { id: 'environments', label: 'Container', Icon: Box },
  { id: 'services', label: 'Services', Icon: Server },
  { id: 'health', label: 'Health', Icon: Activity },
  { id: 'secrets', label: 'Secrets', Icon: Key },
];

const QUICK_ACTIONS = [
  { label: 'Deploy LMS', command: 'Deploy the LMS service' },
  { label: 'Deploy admin', command: 'Deploy the admin service' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'System health', command: 'Check system health' },
];

function normalizeWorkspace(tab: string | null): { workspace: Workspace; mode: StudioMode } {
  if (tab === 'deploy') return { workspace: 'deploy', mode: 'ask' };
  if (tab === 'files' || tab === 'explorer' || tab === 'docs' || tab === 'documents') return { workspace: 'files', mode: 'ask' };
  if (tab === 'git') return { workspace: 'git', mode: 'ask' };
  if (tab === 'terminal' || tab === 'command') return { workspace: 'terminal', mode: 'ask' };
  if (tab === 'container' || tab === 'environments') return { workspace: 'environments', mode: 'ask' };
  if (tab === 'services') return { workspace: 'services', mode: 'ask' };
  if (tab === 'health') return { workspace: 'health', mode: 'ask' };
  if (tab === 'secrets') return { workspace: 'secrets', mode: 'ask' };
  if (tab === 'studio' || tab === 'chat' || tab === 'ellie' || tab === 'automation') return { workspace: 'ellie', mode: 'ask' };
  if (tab === 'courses' || tab === 'course') return { workspace: 'ellie', mode: 'courses' };
  if (tab === 'run') return { workspace: 'ellie', mode: 'run' };
  return { workspace: 'ellie', mode: 'ask' };
}

export default function DevStudioControlPlaneClient({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const searchParams = useSearchParams();
  const initial = normalizeWorkspace(searchParams.get('tab'));
  const [workspace, setWorkspace] = useState<Workspace>(
    initial.workspace === 'secrets' && !isSuperAdmin ? 'ellie' : initial.workspace,
  );
  const [studioMode, setStudioMode] = useState<StudioMode>(initial.mode);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [programs, setPrograms] = useState<CourseProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  const refreshHealth = useCallback(() => {
    setHealthLoading(true);
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/admin/devstudio/config')
      .then((r) => r.json())
      .then((data: StudioConfig) => {
        setConfig(data);
        const nextPreview = data.defaultPreviewUrl || window.location.origin;
        setPreviewUrl((current) => current || nextPreview);
        setLivePreviewUrl((current) => current || nextPreview);
      })
      .catch(() => {
        setConfig(null);
        setPreviewUrl((current) => current || window.location.origin);
        setLivePreviewUrl((current) => current || window.location.origin);
      });
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    setProgramsLoading(true);
    fetch('/api/admin/programs?status=active')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((payload) => {
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setPrograms(
          rows.map((program: { id: string; title?: string; name?: string; slug?: string; code?: string }) => ({
            id: program.id,
            title: program.title ?? program.name ?? program.code ?? 'Untitled program',
            slug: program.slug ?? program.code ?? program.id,
          })),
        );
      })
      .catch(() => setPrograms([]))
      .finally(() => setProgramsLoading(false));
  }, []);

  const activeProviders = useMemo(() => {
    if (!health) return 'checking…';
    return (
      [
        health.hasGroq && 'Groq',
        health.hasGemini && 'Gemini',
        health.hasOpenAI && 'OpenAI',
        health.hasAnthropic && 'Anthropic',
      ]
        .filter(Boolean)
        .join(' · ') || 'no AI keys in env'
    );
  }, [health]);

  function openWorkspace(next: Workspace) {
    if (next === 'secrets' && !isSuperAdmin) {
      setWorkspace('health');
      return;
    }
    setWorkspace(next);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full flex-col overflow-hidden bg-slate-50 text-slate-800">
      <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="h-5 w-5 text-brand-blue-600" />
          <div>
            <span className="text-sm font-semibold text-slate-900">Dev Studio</span>
            <p className="text-[11px] text-slate-500">Operations control plane — live deploys, env, and Ellie</p>
          </div>
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">AI: {activeProviders}</span>
          <Link
            href="/admin/workflows"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-700 hover:bg-slate-50"
          >
            <Workflow className="h-3.5 w-3.5" />
            Platform workflows
          </Link>
          <button
            type="button"
            onClick={() => openWorkspace('deploy')}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-blue-600 px-3 text-sm font-medium text-white hover:bg-brand-blue-700"
          >
            <Rocket className="h-3.5 w-3.5" />
            Deploy
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white p-2 md:flex">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workspaces</p>
          <nav className="space-y-0.5">
            {WORKSPACES.filter((item) => item.id !== 'secrets' || isSuperAdmin).map(({ id, label, Icon }) => {
              const active = workspace === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openWorkspace(id)}
                  className={`flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm transition ${
                    active ? 'bg-brand-blue-50 font-medium text-brand-blue-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-slate-100 pt-2 px-2 text-[10px] text-slate-400">
            Secrets: platform_secrets → app_secrets → process.env
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <MobileTabs workspace={workspace} isSuperAdmin={isSuperAdmin} onChange={openWorkspace} />
            {workspace === 'ellie' && (
              <StudioPanel
                mode={studioMode}
                onModeChange={setStudioMode}
                programs={programs}
                programsLoading={programsLoading}
              />
            )}
            {workspace === 'deploy' && <DeployPanel workflowButtons={config?.workflowButtons} variant="admin" />}
            {workspace === 'files' && <FilesPanel />}
            {workspace === 'git' && (
              <div className="h-full overflow-hidden bg-white">
                <GitPanel />
              </div>
            )}
            {workspace === 'terminal' && (
              <div className="flex h-full flex-col bg-slate-900">
                <div className="border-b border-slate-700 px-3 py-2 text-xs text-slate-300">
                  ECS studio shell when <code className="text-slate-100">STUDIO_SHELL_*</code> is configured; otherwise
                  use Deploy or Run commands.
                </div>
                <div className="min-h-0 flex-1">
                  <XTerminal />
                </div>
              </div>
            )}
            {workspace === 'environments' && (
              <div className="h-full overflow-auto bg-white">
                <DevContainerPanel />
              </div>
            )}
            {workspace === 'services' && (
              <div className="h-full overflow-auto bg-white p-4">
                <ServicesPanel />
              </div>
            )}
            {workspace === 'health' && (
              <HealthWorkspace health={health} loading={healthLoading} onRefresh={refreshHealth} />
            )}
            {workspace === 'secrets' &&
              (isSuperAdmin ? (
                <div className="h-full overflow-auto bg-white">
                  <SecretsPanel />
                </div>
              ) : (
                <HealthWorkspace health={health} loading={healthLoading} onRefresh={refreshHealth} />
              ))}
          </main>

          <section className="hidden min-h-0 w-[min(42vw,520px)] shrink-0 p-2 lg:flex lg:flex-col">
            <ColoredLivePreviewFrame
              className="h-full min-h-0 flex-1"
              minHeight={400}
              targets={(config?.previewTargets ?? []).map((t) => ({ label: t.label, url: t.url }))}
              defaultUrl={previewUrl}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function MobileTabs({
  workspace,
  isSuperAdmin,
  onChange,
}: {
  workspace: Workspace;
  isSuperAdmin: boolean;
  onChange: (workspace: Workspace) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-1 md:hidden">
      {WORKSPACES.filter((item) => item.id !== 'secrets' || isSuperAdmin).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs ${
            workspace === id ? 'bg-brand-blue-50 text-brand-blue-800' : 'text-slate-600'
          }`}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="max-w-[4.5rem] truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

function StudioPanel({
  mode,
  onModeChange,
  programs,
  programsLoading,
}: {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  programs: CourseProgram[];
  programsLoading: boolean;
}) {
  const modes: { id: StudioMode; label: string; Icon: ElementType<{ className?: string }> }[] = [
    { id: 'ask', label: 'Ellie', Icon: MessageSquare },
    { id: 'run', label: 'Run', Icon: Sparkles },
    { id: 'courses', label: 'Course builder', Icon: BookOpen },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-slate-200 px-2">
        {modes.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ${
              mode === id ? 'bg-brand-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === 'ask' && (
          <div className="h-full">
            <AIChat ellieMode />
          </div>
        )}
        {mode === 'run' && <RunPanel />}
        {mode === 'courses' &&
          (programsLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading active programs…</span>
            </div>
          ) : (
            <AICourseBuilderChat programs={programs} embedded />
          ))}
      </div>
    </div>
  );
}

function RunPanel() {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<{ type: 'user' | 'output' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  async function run(command: string) {
    const trimmed = command.trim();
    if (!trimmed || loading) return;
    setInput('');
    setLoading(true);
    setLines([{ type: 'user', text: trimmed }]);

    try {
      const isSmoke = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(trimmed);
      const res = await fetch(
        isSmoke ? '/api/devstudio/smoke-test' : '/api/devstudio/execute',
        isSmoke
          ? undefined
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: trimmed }),
            },
      );

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          if (!chunk.startsWith('data: ')) continue;
          const raw = chunk.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          let text = raw;
          try {
            const parsed = JSON.parse(raw);
            text = parsed.line ?? parsed.text ?? parsed.output ?? raw;
          } catch {
            text = raw;
          }
          setLines((current) => [...current, { type: 'output', text }]);
        }
      }
    } catch (error) {
      setLines((current) => [
        ...current,
        { type: 'error', text: error instanceof Error ? error.message : 'Command failed' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-200 bg-white px-3 py-2">
        {QUICK_ACTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => run(item.command)}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-800">
        {lines.length === 0 && <p className="text-slate-400">Run deploy or diagnostics commands (streams from /api/devstudio/execute).</p>}
        {lines.map((line, index) => (
          <div
            key={`${line.type}-${index}`}
            className={`whitespace-pre-wrap break-words ${
              line.type === 'user' ? 'text-brand-blue-700' : line.type === 'error' ? 'text-red-600' : 'text-slate-700'
            }`}
          >
            {line.type === 'user' ? `$ ${line.text}` : line.text}
          </div>
        ))}
        {loading && (
          <div className="mt-2 flex items-center gap-2 text-brand-blue-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault();
          run(input);
        }}
      >
        <span className="font-mono text-sm font-bold text-brand-blue-600">$</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 font-mono text-sm outline-none focus:border-brand-blue-500"
          placeholder="Deploy LMS, run smoke test, check health…"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-600 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

const MAX_UPLOAD_BYTES = 512 * 1024;
const TEXT_UPLOAD_EXTENSIONS = new Set([
  'css', 'csv', 'html', 'js', 'jsx', 'json', 'md', 'mdx', 'mjs', 'sql', 'svg', 'ts', 'tsx', 'txt', 'xml', 'yml', 'yaml',
]);

function sanitizeUploadPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim();
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
      setStatus(error instanceof Error ? error.message : 'File tree unavailable (needs GITHUB_TOKEN)');
    }
  }, []);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setStatus('');
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus(`Upload exceeds ${MAX_UPLOAD_BYTES / 1024} KB limit`);
      return;
    }
    if (!isEditableUpload(file)) {
      setStatus('Upload must be a text/code file');
      return;
    }
    try {
      const nextPath = sanitizeUploadPath(uploadPath || `devstudio-uploads/${file.name}`);
      const text = await file.text();
      setSelected(nextPath);
      setUploadPath(nextPath);
      setContent(text);
      setSha('');
      setMessage(`chore: add ${nextPath} via Dev Studio`);
      setStatus('Ready to commit');
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
      setStatus(data.commit ? 'Committed to GitHub' : 'Saved');
      if (method === 'POST') {
        setFiles((current) => (current.includes(selected) ? current : [...current, selected].sort()));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-200">
        <div className="border-b border-slate-200 p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Repository files</p>
          <div className="flex gap-1">
            <input
              value={uploadPath}
              onChange={(event) => setUploadPath(sanitizeUploadPath(event.target.value))}
              className="h-8 min-w-0 flex-1 rounded border border-slate-200 px-2 font-mono text-[11px] outline-none"
              placeholder="path/in/repo.ts"
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                void handleUpload(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-brand-blue-600 text-white"
              title="Upload"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
          <button type="button" onClick={() => refreshFiles()} className="mt-2 text-[11px] text-brand-blue-600 hover:underline">
            Refresh tree
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {files.map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => loadFile(file)}
              className={`flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left text-[11px] ${
                selected === file ? 'bg-brand-blue-50 text-brand-blue-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-500">{selected || 'Select a file'}</span>
          {status && <span className="text-xs text-brand-green-700">{status}</span>}
          <button
            type="button"
            onClick={saveFile}
            disabled={!selected || loading}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-blue-600 px-3 text-xs font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Commit
          </button>
        </div>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="h-9 shrink-0 border-b border-slate-200 px-3 font-mono text-xs outline-none"
          placeholder="Commit message"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-0 flex-1 resize-none p-3 font-mono text-xs outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function HealthWorkspace({
  health,
  loading,
  onRefresh,
}: {
  health: Record<string, unknown> | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const rows = [
    ['GitHub token', health?.hasGitHub ? 'configured' : 'missing — deploy & files disabled'],
    ['Groq', health?.hasGroq ? 'configured' : 'missing'],
    ['Gemini', health?.hasGemini ? 'configured' : 'missing'],
    ['OpenAI', health?.hasOpenAI ? 'configured' : 'missing'],
    ['Supabase URL', health?.supabaseUrlPresent ? 'present' : 'missing'],
    ['Supabase service key', health?.supabaseServiceKeyPresent ? 'present' : 'missing'],
    ['Node', String(health?.nodeVersion ?? '—')],
    ['Next.js', String(health?.nextVersion ?? '—')],
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Integration health</h2>
          <p className="text-xs text-slate-500">Runtime secrets and API connectivity for this admin task</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
            <span className="text-slate-500">{label}</span>
            <span className="font-mono text-xs text-slate-800">{value}</span>
          </div>
        ))}
      </div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">AWS ECS services</h3>
      <EcsStatusPanel />
    </div>
  );
}
