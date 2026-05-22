import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CourseBuilderPageClient } from './CourseBuilderPageClient';
import CourseBuilderClient from './CourseBuilderClient';
import AICourseBuilderChat from '../courses/ai-builder/AICourseBuilderChat';
import Link from 'next/link';
import { Layout, BookOpen, ChevronDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CourseBuilderPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();

  const [{ data: courses }, { data: programs }] = await Promise.all([
    db.from('courses')
      .select('id, title, description, program_id, duration_hours, status, is_active, created_at, programs(id, title)')
      .order('updated_at', { ascending: false })
      .limit(50),
    db.from('programs')
      .select('id, title')
      .eq('is_active', true)
      .order('title'),
  ]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Course Builder</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Describe what you need — the AI builds the course structure for you
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/course-builder/templates"
            className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold rounded-lg transition-colors">
            <Layout className="w-3.5 h-3.5" /> Templates
          </Link>
          <Link href="/admin/course-builder/media"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors">
            Media Library
          </Link>
          <Link href="/admin/course-builder/assessments"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors">
            Assessments
          </Link>
          <Link href="/admin/courses"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> All Courses
          </Link>
        </div>
      </div>

      {/* ── AI Chat Builder — PRIMARY INTERFACE ── */}
      <div className="rounded-2xl border border-brand-red-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-brand-red-50 to-white border-b border-brand-red-100">
          <div className="w-8 h-8 rounded-lg bg-brand-red-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-5.303 0l-.347-.347z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">AI Course Builder</p>
            <p className="text-xs text-slate-500">
              Tell me what program you need a course for — I&apos;ll ask a few questions and build the full structure
            </p>
          </div>
        </div>
        <AICourseBuilderChat programs={(programs ?? []) as any} />
      </div>

      {/* ── Manual tools — collapsed by default ── */}
      <details className="group rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
          <div>
            <p className="font-semibold text-slate-700 text-sm">Manual Builder &amp; Blueprint Tools</p>
            <p className="text-xs text-slate-400 mt-0.5">Advanced — create courses from blueprints or edit manually</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
        </summary>

        <div className="border-t border-slate-100 p-5 space-y-6">
          {/* Architecture callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <div>
              <p className="font-semibold text-slate-700 mb-0.5">Program — definition layer</p>
              <p className="text-slate-500 text-xs">Title, description, outcomes, credentials, funding tracks, compliance profile. Managed in Programs.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-0.5">Course — execution layer</p>
              <p className="text-slate-500 text-xs">Modules, lessons, quizzes, competencies, hours. What learners run. Linked via <code className="bg-slate-200 px-1 rounded">program_course_map</code>.</p>
            </div>
          </div>

          <CourseBuilderPageClient />

          <div className="border-t border-slate-200 pt-6">
            <CourseBuilderClient
              initialCourses={(courses ?? []) as any}
              programs={(programs ?? []) as any}
            />
          </div>
        </div>
      </details>

    </div>
  );
}
