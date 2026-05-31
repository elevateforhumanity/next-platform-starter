'use client';

import { type ElementType, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  ExternalLink,
  FolderOpen,
  GitBranch,
  Globe,
  Key,
  Loader2,
  MessageSquare,
  RefreshCw,
  Rocket,
  Server,
  Terminal,
  Workflow,
} from 'lucide-react';
import IframePreview from '@/components/dev-studio/IframePreview';
import DevStudioPwaHint from '@/components/dev-studio/DevStudioPwaHint';

type Workspace =
  | 'studio'
  | 'deploy'
  | 'services'
  | 'environments'
  | 'terminal'
  | 'git'
  | 'files'
  | 'workflows'
  | 'health'
  | 'secrets';

type StudioMode = 'ellie' | 'courses';

interface CourseProgram {
  id: string;
  title: string;
  slug: string;
}

const AIChat = dynamic(() => import('@/components/dev-studio/AIChat'), { ssr: false });
const DeployPanel = dynamic(() => import('@/components/dev-studio/DeployPanel'), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/dev-studio/ServicesPanel'), { ssr: false });
const SecretsPanel = dynamic(() => import('@/components/dev-studio/SecretsPanel'), { ssr: false });
const GitPanel = dynamic(() => import('@/components/dev-studio/GitPanel'), { ssr: false });
const XTerminal = dynamic(() => import('@/components/dev-studio/XTerminal'), { ssr: false });
const DevStudioHealthPanel = dynamic(() => import('@/components/dev-studio/DevStudioHealthPanel'), { ssr: false });
const DevStudioWorkflowsPanel = dynamic(
  () => import('@/components/dev-studio/DevStudioWorkflowsPanel'),
  { ssr: false },
);
const FilesWorkspace = dynamic(() => import('@/components/dev-studio/DevStudioFilesWorkspace'), { ssr: false });
const AICourseBuilderChat = dynamic(
  () => import('../courses/ai-builder/AICourseBuilderChat'),
  { ssr: false },
);

const WORKSPACES: { id: Workspace; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'studio', label: 'Ellie', Icon: Bot },
  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'services', label: 'Services', Icon: Server },
  { id: 'environments', label: 'Container', Icon: Box },
  { id: 'terminal', label: 'Terminal', Icon: Terminal },
  { id: 'git', label: 'Git', Icon: GitBranch },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'workflows', label: 'Workflows', Icon: Workflow },
  { id: 'health', label: 'Health', Icon: Activity },
  { id: 'secrets', label: 'Secrets', Icon: Key },
];

function normalizeTab(tab: string | null): { workspace: Workspace; mode: StudioMode } {
  if (tab === 'deploy') return { workspace: 'deploy', mode: 'ellie' };
  if (tab === 'git') return { workspace: 'git', mode: 'ellie' };
  if (tab === 'files' || tab === 'docs') return { workspace: 'files', mode: 'ellie' };
  if (tab === 'container' || tab === 'environments') return { workspace: 'environments', mode: 'ellie' };
  if (tab === 'services') return { workspace: 'services', mode: 'ellie' };
  if (tab === 'health') return { workspace: 'health', mode: 'ellie' };
  if (tab === 'secrets') return { workspace: 'secrets', mode: 'ellie' };
  if (tab === 'automation' || tab === 'workflows') return { workspace: 'workflows', mode: 'ellie' };
  if (tab === 'terminal' || tab === 'command' || tab === 'run') return { workspace: 'terminal', mode: 'ellie' };
  if (tab === 'courses' || tab === 'course') return { workspace: 'studio', mode: 'courses' };
  if (tab === 'ellie' || tab === 'chat') return { workspace: 'studio', mode: 'ellie' };
  return { workspace: 'studio', mode: 'ellie' };
}

export default function DevStudioControlPlaneClient({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const searchParams = useSearchParams();
  const initial = normalizeTab(searchParams.get('tab'));
  const [workspace, setWorkspace] = useState<Workspace>(
    initial.workspace === 'secrets' && !isSuperAdmin ? 'studio' : initial.workspace,
  );
  const [studioMode, setStudioMode] = useState<StudioMode>(initial.mode);
  const [previewUrl, setPreviewUrl] = useState('');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [programs, setPrograms] = useState<CourseProgram[]>([]);
  const [aiLabel, setAiLabel] = useState('checking…');

  useEffect(() => {
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const parts = [
          d?.hasGroq && 'Groq',
          d?.hasOpenAI && 'OpenAI',
          d?.hasAnthropic && 'Claude',
          d?.hasGemini && 'Gemini',
        ].filter(Boolean);
        setAiLabel(parts.join(' / ') || 'no keys');
      })
      .catch(() => setAiLabel('offline'));
  }, []);

  useEffect(() => {
    fetch('/api/admin/devstudio/config')
      .then((r) => r.json())
      .then((data: { defaultPreviewUrl?: string }) => {
        const url = data.defaultPreviewUrl || window.location.origin;
        setPreviewUrl((c) => c || url);
        setLivePreviewUrl((c) => c || url);
      })
      .catch(() => {
        setPreviewUrl((c) => c || window.location.origin);
        setLivePreviewUrl((c) => c || window.location.origin);
      });
  }, []);

  useEffect(() => {
    fetch('/api/admin/programs?status=active')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((payload) => {
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setPrograms(
          rows.map((p: { id: string; title?: string; name?: string; slug?: string; code?: string }) => ({
            id: p.id,
            title: p.title ?? p.name ?? p.code ?? 'Program',
            slug: p.slug ?? p.code ?? p.id,
          })),
        );
      })
      .catch(() => setPrograms([]));
  }, []);

  const nav = useMemo(
    () => WORKSPACES.filter((w) => w.id !== 'secrets' || isSuperAdmin),
    [isSuperAdmin],
  );

  function open(ws: Workspace) {
    if (ws === 'secrets' && !isSuperAdmin) return;
    setWorkspace(ws);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 text-slate-900">
      <DevStudioPwaHint />
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <Bot className="h-5 w-5 text-brand-blue-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Dev Studio</p>
          <p className="text-[10px] text-slate-500">Live ECS · GitHub Actions · Supabase</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-brand-green-50 px-2 py-0.5 text-[10px] text-brand-green-800">
            {aiLabel}
          </span>
          <button
            type="button"
            onClick={() => open('deploy')}
            className="rounded-lg bg-brand-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue-700"
          >
            <Rocket className="mr-1 inline h-3.5 w-3.5" />
            Deploy
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-44 shrink-0 flex-col border-r border-slate-200 bg-white p-2 md:flex">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => open(id)}
              className={`mb-0.5 flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs ${
                workspace === id ? 'bg-brand-blue-50 font-medium text-brand-blue-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white p-1 md:hidden">
              {nav.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => open(id)}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] ${
                    workspace === id ? 'bg-brand-blue-50 text-brand-blue-900' : 'text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {workspace === 'studio' && (
              <div className="flex h-full flex-col bg-white">
                <div className="flex gap-1 border-b border-slate-200 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setStudioMode('ellie')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      studioMode === 'ellie' ? 'bg-brand-blue-50 text-brand-blue-900' : 'text-slate-600'
                    }`}
                  >
                    <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
                    Ellie
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioMode('courses')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      studioMode === 'courses' ? 'bg-brand-blue-50 text-brand-blue-900' : 'text-slate-600'
                    }`}
                  >
                    <BookOpen className="mr-1 inline h-3.5 w-3.5" />
                    Course builder
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  {studioMode === 'ellie' ? (
                    <AIChat ellieMode unifiedEllieMode embedded />
                  ) : programs.length ? (
                    <AICourseBuilderChat programs={programs} embedded />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading programs…
                    </div>
                  )}
                </div>
              </div>
            )}
            {workspace === 'deploy' && <DeployPanel />}
            {workspace === 'services' && <ServicesPanel />}
            {workspace === 'environments' && (
              <div className="h-full overflow-auto bg-white">
                <DevContainerPanel />
              </div>
            )}
            {workspace === 'terminal' && (
              <div className="flex h-full flex-col bg-slate-900">
                <p className="shrink-0 border-b border-slate-700 px-3 py-2 text-xs text-slate-300">
                  Studio ECS shell — set STUDIO_SHELL_* in Secrets, deploy studio service.
                </p>
                <div className="min-h-0 flex-1">
                  <XTerminal />
                </div>
              </div>
            )}
            {workspace === 'git' && (
              <div className="h-full bg-white">
                <GitPanel />
              </div>
            )}
            {workspace === 'files' && <FilesWorkspace />}
            {workspace === 'workflows' && <DevStudioWorkflowsPanel />}
            {workspace === 'health' && <DevStudioHealthPanel />}
            {workspace === 'secrets' && (isSuperAdmin ? <SecretsPanel /> : <DevStudioHealthPanel />)}
          </main>

          <aside className="hidden w-[min(38vw,520px)] shrink-0 flex-col border-l border-slate-200 bg-white lg:flex">
            <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
              <button
                type="button"
                onClick={() => setLivePreviewUrl(previewUrl)}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <form
                className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-white px-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setLivePreviewUrl(previewUrl);
                }}
              >
                <Globe className="mr-1 h-3.5 w-3.5 text-brand-blue-600" />
                <input
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className="h-7 min-w-0 flex-1 text-[11px] outline-none"
                />
              </form>
              <a
                href={livePreviewUrl || previewUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <IframePreview url={livePreviewUrl || previewUrl} className="min-h-0 flex-1" />
          </aside>
        </div>
      </div>
    </div>
  );
}
