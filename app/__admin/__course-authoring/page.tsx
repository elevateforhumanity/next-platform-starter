import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, Video, BookOpen, Edit3, Plus, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Authoring | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function CourseAuthoringPage() {
  await requireRole(['admin', 'super_admin', 'staff', 'instructor']);
  const db = getAdminClient();

  const [{ data: lessons }, { data: courses }] = await Promise.all([
    db.from('course_lessons')
      .select('id, title, lesson_type, course_id, created_at')
      .order('created_at', { ascending: false })
      .limit(60),
    db.from('courses')
      .select('id, title, status')
      .order('updated_at', { ascending: false })
      .limit(30),
  ]);

  const lessonRows = lessons ?? [];
  const courseRows = courses ?? [];
  const courseMap: Record<string, string> = {};
  for (const c of courseRows) courseMap[c.id] = c.title;

  const byType: Record<string, number> = {};
  for (const l of lessonRows) {
    byType[l.lesson_type] = (byType[l.lesson_type] ?? 0) + 1;
  }

  const LESSON_TYPE_ICONS: Record<string, typeof FileText> = {
    video: Video,
    reading: FileText,
    quiz: CheckCircle,
    lab: BookOpen,
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Course Authoring</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage lesson content across all courses</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/courses/generate" className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              AI Generate
            </Link>
            <Link href="/admin/courses/create" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> New Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Lesson type breakdown */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(byType).map(([type, count]) => {
            const Icon = LESSON_TYPE_ICONS[type] ?? BookOpen;
            return (
              <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                <Icon className="w-3.5 h-3.5" />
                {type} <span className="text-slate-400">({count})</span>
              </span>
            );
          })}
        </div>

        {/* Lessons table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">All Lessons ({lessonRows.length})</h2>
          </div>
          {lessonRows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No lessons yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Lesson</th>
                    <th className="px-6 py-3 text-left">Course</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Notes</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lessonRows.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{l.title}</td>
                      <td className="px-6 py-4 text-slate-500">{courseMap[l.course_id] ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{l.lesson_type}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {courseMap[l.course_id] ? '—' : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/courses/${l.course_id}/lessons/${l.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
