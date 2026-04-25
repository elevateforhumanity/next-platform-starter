import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import CourseBuilderTabs from './CourseBuilderTabs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Course | Admin | Elevate LMS',
  description: 'Build a new course from a prompt, syllabus, or manually.',
};

export default async function CreateCoursePage() {
  await requireAdmin();

  const db = await getAdminClient();
  const { data: programs } = await db
    .from('programs')
    .select('id, title')
    .in('status', ['active', 'published'])
    .order('title');

  const { data: complianceProfiles } = await db
    .from('compliance_profiles')
    .select('key, label')
    .order('label')
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-slate-500">
            <li><Link href="/admin" className="hover:text-brand-blue-600">Admin</Link></li>
            <li>/</li>
            <li><Link href="/admin/courses" className="hover:text-brand-blue-600">Courses</Link></li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Create</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create New Course</h1>
          <p className="text-slate-600 mt-1">
            Use AI to generate from a prompt or document, or build manually module-by-module.
            All courses write to the canonical LMS tables and appear in the learner portal once published.
          </p>
        </div>

        <CourseBuilderTabs
          programs={programs ?? []}
          complianceProfiles={complianceProfiles ?? []}
        />
      </div>
    </div>
  );
}
