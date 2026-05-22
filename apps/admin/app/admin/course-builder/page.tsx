import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CourseBuilderPageClient } from './CourseBuilderPageClient';
import CourseBuilderClient from './CourseBuilderClient';
import Link from 'next/link';
import { Zap, Layout, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CourseBuilderPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const db = await requireAdminClient();

  // Load courses for the manual builder list + quick-access bar
  const { data: courses } = await db
    .from('courses')
    .select('id, title, description, program_id, duration_hours, status, is_active, created_at, programs(id, title)')
    .order('updated_at', { ascending: false })
    .limit(50);

  // Load programs for the create/edit form dropdown
  const { data: programs } = await db
    .from('programs')
    .select('id, title')
    .eq('is_active', true)
    .order('title');

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Course Builder</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage courses for your programs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/course-builder/templates"
            className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Layout className="w-3.5 h-3.5" /> Templates
          </Link>
          <Link
            href="/admin/course-builder/media"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Media Library
          </Link>
          <Link
            href="/admin/course-builder/assessments"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Assessments
          </Link>
          <Link
            href="/admin/courses"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> All Courses
          </Link>
        </div>
      </div>

      {/* Architecture callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
        <div>
          <p className="font-semibold text-slate-700 mb-0.5">Program — definition layer</p>
          <p className="text-slate-500 text-xs">Title, description, outcomes, credentials, funding tracks, compliance profile, CTAs. Managed in Programs.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-700 mb-0.5">Course — execution layer</p>
          <p className="text-slate-500 text-xs">Modules, lessons, quizzes, competencies, hours, validation. What learners actually run. Linked to a program via <code className="bg-slate-200 px-1 rounded">program_course_map</code>.</p>
        </div>
      </div>

      {/* Blueprint-driven AI course generator */}
      <CourseBuilderPageClient />

      {/* Manual CRUD builder */}
      <div className="border-t border-slate-200 pt-6">
        <CourseBuilderClient
          initialCourses={(courses ?? []) as any}
          programs={(programs ?? []) as any}
        />
      </div>
    </div>
  );
}
