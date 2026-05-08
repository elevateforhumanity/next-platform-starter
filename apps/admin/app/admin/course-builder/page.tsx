import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import PageClient from './PageClient';
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
    <div>
      {/* Quick-access bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-2">
          Quick Access
        </span>

        <Link
          href="/admin/course-builder/templates"
          className="flex items-center gap-2 px-4 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <Layout className="w-3.5 h-3.5" /> Template Gallery
        </Link>

        <Link
          href="/admin/courses"
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" /> All Courses
        </Link>

        {/* Recent courses — Live Builder shortcuts */}
        {(courses ?? []).slice(0, 5).map((c) => (
          <Link
            key={c.id}
            href={'/admin/course-builder/' + c.id}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-brand-red-400 hover:bg-brand-red-50 text-slate-600 hover:text-brand-red-700 text-xs font-semibold rounded-lg transition-colors max-w-[180px] truncate"
            title={`Live Builder: ${c.title}`}
          >
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{c.title}</span>
          </Link>
        ))}
      </div>

      {/* Blueprint-driven AI course generator */}
      <PageClient />

      {/* Manual CRUD builder — create, edit, publish, clone, archive courses */}
      <div className="mt-8 border-t border-slate-200 pt-8">
        <CourseBuilderClient
          initialCourses={(courses ?? []) as any}
          programs={(programs ?? []) as any}
        />
      </div>
    </div>
  );
}
