'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowRight,
  BookOpen,
  Sparkles,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  LayoutList,
  ChevronRight,
  ExternalLink,
  Loader2,
  Globe,
  AlertCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load the AI generator form — it's large and only needed on the AI tab
const CourseGeneratorClient = dynamic(
  () => import('../../courses/generate/CourseGeneratorClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        Loading AI generator…
      </div>
    ),
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Program {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  is_active: boolean;
  published: boolean;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface AiProgram {
  id: string;
  name: string;
  category: string;
}

interface Props {
  programs: Program[];
  courseCountMap: Record<string, number>;
  aiPrograms: AiProgram[];
  initialTab: string;
  initialProgramId?: string;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'programs', label: 'All Programs', icon: LayoutList },
  { id: 'structure', label: 'Structure', icon: Layers },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'ai', label: 'AI Assist', icon: Sparkles },
  { id: 'publish', label: 'Publish', icon: CheckCircle },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgramBuilderClient({
  programs,
  courseCountMap,
  aiPrograms,
  initialTab,
  initialProgramId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const validTabs = TABS.map((t) => t.id) as string[];
  const [activeTab, setActiveTab] = useState<TabId>(
    validTabs.includes(initialTab) ? (initialTab as TabId) : 'programs',
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(initialProgramId);

  // Sync tab to URL without full navigation
  function switchTab(tab: TabId) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (selectedProgramId) params.set('programId', selectedProgramId);
    router.replace(`/admin/programs/builder?${params.toString()}`, { scroll: false });
  }

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Program Builder
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Create and manage training programs, modules, and lessons
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/programs"
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              All Programs <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/programs/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Program
            </Link>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'programs' && (
          <ProgramsTab
            programs={programs}
            courseCountMap={courseCountMap}
            selectedProgramId={selectedProgramId}
            onSelect={(id) => {
              setSelectedProgramId(id);
              switchTab('structure');
            }}
          />
        )}
        {activeTab === 'structure' && (
          <StructureTab
            program={selectedProgram}
            programs={programs}
            onSelectProgram={setSelectedProgramId}
          />
        )}
        {activeTab === 'curriculum' && (
          <CurriculumTab
            program={selectedProgram}
            programs={programs}
            onSelectProgram={setSelectedProgramId}
          />
        )}
        {activeTab === 'ai' && <AITab aiPrograms={aiPrograms} />}
        {activeTab === 'publish' && (
          <PublishTab
            program={selectedProgram}
            programs={programs}
            onSelectProgram={setSelectedProgramId}
            onPublished={() => router.refresh()}
          />
        )}
      </div>
    </div>
  );
}

// ─── Programs tab ─────────────────────────────────────────────────────────────

function ProgramsTab({
  programs,
  courseCountMap,
  selectedProgramId,
  onSelect,
}: {
  programs: Program[];
  courseCountMap: Record<string, number>;
  selectedProgramId?: string;
  onSelect: (id: string) => void;
}) {
  const published = programs.filter((p) => p.published);
  const drafts = programs.filter((p) => !p.published);

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Create Program',
            desc: 'Define a new training program with modules and credentials.',
            href: '/admin/programs/new',
            icon: Plus,
          },
          {
            title: 'Blueprint Builder',
            desc: 'Use a CredentialBlueprint to auto-generate course structure.',
            href: '/admin/course-builder',
            icon: Layers,
          },
          {
            title: 'Curriculum Manager',
            desc: 'Edit lessons, step types, and quiz questions for any course.',
            href: '/admin/curriculum',
            icon: BookOpen,
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <Icon className="w-6 h-6 text-blue-500 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">{action.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{action.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:gap-2 transition-all">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Programs table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Programs ({programs.length})</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {published.length}{' '}
              published
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> {drafts.length}{' '}
              draft
            </span>
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No programs yet.{' '}
            <Link href="/admin/programs/new" className="text-blue-600 hover:underline">
              Create one
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Program</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Courses</th>
                  <th className="px-6 py-3 text-left">Updated</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programs.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedProgramId === p.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => onSelect(p.id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {selectedProgramId === p.id && (
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        {p.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.category ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {courseCountMap[p.id] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/programs/${p.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/curriculum?program=${p.id}`}
                          className="text-slate-500 hover:underline text-xs"
                        >
                          Curriculum
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Structure tab ────────────────────────────────────────────────────────────

function StructureTab({
  program,
  programs,
  onSelectProgram,
}: {
  program?: Program;
  programs: Program[];
  onSelectProgram: (id: string) => void;
}) {
  if (!program) {
    return (
      <ProgramSelector
        programs={programs}
        onSelect={onSelectProgram}
        prompt="Select a program to edit its structure"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProgramBreadcrumb program={program} />

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Program Structure</h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/curriculum/${program.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <BookOpen className="w-4 h-4" /> Open Curriculum Manager
            </Link>
            <Link
              href={`/admin/programs/${program.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:underline"
            >
              <Settings className="w-4 h-4" /> Program Settings
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-sm">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700 mb-1">Visual structure editor</p>
          <p className="text-xs text-slate-400 mb-4">
            Drag-and-drop module and lesson ordering is managed in the Curriculum Manager.
          </p>
          <Link
            href={`/admin/curriculum/${program.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Open Curriculum Manager <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Sub-tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Assessment Bank',
            desc: 'Manage quizzes and assessments for this program.',
            href: '/admin/course-builder/assessments',
            icon: CheckCircle,
          },
          {
            label: 'Media Library',
            desc: 'Upload and manage course media files.',
            href: '/admin/course-builder/media',
            icon: Eye,
          },
          {
            label: 'Course Templates',
            desc: 'Start from a pre-built course template.',
            href: '/admin/course-builder/templates',
            icon: BookOpen,
          },
        ].map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <Icon className="w-5 h-5 text-blue-500 mb-2" />
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{tool.label}</h3>
              <p className="text-xs text-slate-500">{tool.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Curriculum tab ───────────────────────────────────────────────────────────

function CurriculumTab({
  program,
  programs,
  onSelectProgram,
}: {
  program?: Program;
  programs: Program[];
  onSelectProgram: (id: string) => void;
}) {
  if (!program) {
    return (
      <ProgramSelector
        programs={programs}
        onSelect={onSelectProgram}
        prompt="Select a program to manage its curriculum"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProgramBreadcrumb program={program} />

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-900">Curriculum</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage modules, lessons, step types, and quiz questions
            </p>
          </div>
          <Link
            href={`/admin/curriculum/${program.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Open Full Editor <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              label: 'Lesson Editor',
              desc: 'Edit lesson content, objectives, and step type.',
              href: `/admin/curriculum/${program.id}`,
              icon: BookOpen,
            },
            {
              label: 'Quiz Questions',
              desc: 'Add and edit quiz questions for checkpoint and exam lessons.',
              href: `/admin/curriculum/${program.id}`,
              icon: CheckCircle,
            },
            {
              label: 'Upload Curriculum',
              desc: 'Bulk-import lessons from a CSV or spreadsheet.',
              href: '/admin/curriculum/upload',
              icon: Layers,
            },
            {
              label: 'Blueprint Seeder',
              desc: 'Seed course structure from a CredentialBlueprint.',
              href: '/admin/course-builder',
              icon: Sparkles,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-start gap-4 bg-slate-50 rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-white transition-all"
              >
                <Icon className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-auto mt-0.5 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AI Assist tab ────────────────────────────────────────────────────────────

function AITab({ aiPrograms }: { aiPrograms: AiProgram[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-slate-900">AI Course Generator</h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Generate a complete course draft from a syllabus, document, or prompt. The result is saved
          as a draft course you can edit before publishing.
        </p>
        <CourseGeneratorClient programs={aiPrograms} />
      </div>
    </div>
  );
}

// ─── Publish tab ──────────────────────────────────────────────────────────────

function PublishTab({
  program,
  programs,
  onSelectProgram,
  onPublished,
}: {
  program?: Program;
  programs: Program[];
  onSelectProgram: (id: string) => void;
  onPublished?: (id: string) => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  if (!program) {
    return (
      <ProgramSelector
        programs={programs}
        onSelect={onSelectProgram}
        prompt="Select a program to review and publish"
      />
    );
  }

  const isPublished = program.published;

  const checklist = [
    { label: 'Program title set', done: !!program.title?.trim() },
    { label: 'Program slug set', done: !!program.slug?.trim() },
    { label: 'Category assigned', done: !!program.category?.trim() },
  ];
  const requiredPassing = checklist.filter((c) => c.done).length === checklist.length;

  async function handlePublish() {
    if (!program || publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/programs/${program.id}/publish-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) {
        const detail = json.missing?.length
          ? `Missing: ${json.missing.join(', ')}`
          : (json.error ?? 'Publish failed');
        showToast('error', detail);
      } else {
        showToast(
          'success',
          `"${program.title}" is now live at /programs/${json.slug ?? program.slug}`,
        );
        onPublished?.(program.id);
      }
    } catch {
      showToast('error', 'Network error — please try again');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <ProgramBreadcrumb program={program} />

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-900">Review &amp; Publish</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Check completeness before making this program available to learners
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Checklist */}
        <div className="space-y-3 mb-6">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  item.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {item.done ? '✓' : '○'}
              </span>
              <span className={item.done ? 'text-slate-700' : 'text-slate-400'}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Public URL preview */}
        {program.slug && (
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>
              Public URL: <span className="font-mono text-slate-700">/programs/{program.slug}</span>
            </span>
            {isPublished && (
              <a
                href={`/programs/${program.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-brand-red-600 hover:underline flex items-center gap-1"
              >
                View live <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Publish / Unpublish */}
          {!isPublished ? (
            <button
              onClick={handlePublish}
              disabled={!requiredPassing || publishing}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> Publish Program
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-5 py-2.5 rounded-lg text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> Live
            </span>
          )}

          <Link
            href={`/admin/programs/${program.id}`}
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-4 h-4" /> Edit Settings
          </Link>

          {program.slug && (
            <a
              href={`/programs/${program.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-4 h-4" /> Preview
            </a>
          )}
        </div>

        {!requiredPassing && (
          <p className="mt-3 text-xs text-amber-600">
            Complete all checklist items above before publishing.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ProgramSelector({
  programs,
  onSelect,
  prompt,
}: {
  programs: Program[];
  onSelect: (id: string) => void;
  prompt: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8">
      <p className="text-slate-500 text-sm mb-4">{prompt}</p>
      {programs.length === 0 ? (
        <p className="text-slate-400 text-sm">
          No programs found.{' '}
          <Link href="/admin/programs/new" className="text-blue-600 hover:underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-4 transition-all"
            >
              <p className="font-medium text-slate-900 text-sm">{p.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.category ?? 'No category'}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramBreadcrumb({ program }: { program: Program }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Link href="/admin/programs" className="hover:text-slate-700">
        Programs
      </Link>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-slate-900 font-medium">{program.title}</span>
    </div>
  );
}
