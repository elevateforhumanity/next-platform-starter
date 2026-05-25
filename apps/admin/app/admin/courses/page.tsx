import { Metadata } from 'next';

import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminCoursesOverview } from '@/lib/admin/course-admin-overview';
import { AdminCoursesTable } from './AdminCoursesTable';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Course Management | Admin | Elevate For Humanity',
};

export default async function AdminCoursesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const courses = await getAdminCoursesOverview();

  const complete = courses.filter((c) => c.status === 'complete').length;
  const partial = courses.filter((c) => c.status === 'partial').length;
  const structured = courses.filter((c) => c.status === 'structured').length;
  const empty = courses.filter((c) => c.status === 'empty').length;
  const totalLessons = courses.reduce((sum, c) => sum + c.actualLessons, 0);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Courses' }]} />
          <h1 className="text-2xl font-black text-slate-900 mt-2">Course Management</h1>
          <p className="text-sm text-slate-500">{courses.length} courses · {totalLessons} lessons in DB</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/dev-studio?tab=ellie"
            className="rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Studio
          </Link>
          <Link href="/admin/courses/create"
            className="rounded-lg bg-brand-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-red-700">
            + Create Course
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Courses', value: courses.length, cls: 'text-slate-900' },
          { label: 'Published', value: complete, cls: 'text-emerald-700' },
          { label: 'Drafts', value: partial + structured, cls: 'text-amber-700' },
          { label: 'Empty', value: empty, cls: 'text-slate-400' },
          { label: 'Total Lessons', value: totalLessons, cls: 'text-brand-blue-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <AdminCoursesTable courses={courses} />
    </div>
  );
}
