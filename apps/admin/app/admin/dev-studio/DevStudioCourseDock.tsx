'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookOpen, ExternalLink, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CourseBuilderProgram {
  id: string;
  title: string;
  slug: string;
}

interface CourseBuilderProps {
  programs: CourseBuilderProgram[];
  embedded?: boolean;
  initialProgramId?: string;
}

const AICourseBuilderChat = dynamic<CourseBuilderProps>(
  () => import('../courses/ai-builder/AICourseBuilderChat'),
  { ssr: false },
);

export default function DevStudioCourseDock() {
  const [open, setOpen] = useState(false);
  const [programs, setPrograms] = useState<CourseBuilderProgram[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || programs.length > 0 || loading) return;
    setLoading(true);
    fetch('/api/admin/programs?status=active')
      .then((res) => (res.ok ? res.json() : { data: [] }))
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
      .finally(() => setLoading(false));
  }, [loading, open, programs.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[80] inline-flex h-11 items-center gap-2 rounded-md border border-sky-400 bg-slate-950 px-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-slate-900"
      >
        <BookOpen className="h-4 w-4 text-sky-300" />
        Courses
      </button>

      {open && (
        <section className="fixed inset-y-[72px] right-0 z-[90] flex w-full max-w-5xl flex-col border-l border-slate-800 bg-slate-50 shadow-2xl md:w-[78vw] lg:w-[64vw]">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3">
            <div className="flex min-w-0 items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-600" />
              <span className="truncate text-sm font-semibold text-slate-900">AI Course Builder</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/courses/create"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Open full course builder"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Close course builder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Loading active programs...</span>
              </div>
            ) : (
              <AICourseBuilderChat programs={programs} embedded />
            )}
          </div>
        </section>
      )}
    </>
  );
}
