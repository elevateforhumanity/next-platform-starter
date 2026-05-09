import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ChevronRight, BookOpen, Clock, Play, CheckCircle, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Courses | Student Portal',
  description: 'Access your enrolled courses.',
};

export const dynamic = 'force-dynamic';

export default async function StudentCoursesPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal/courses');

  const db = await requireAdminClient();

  // Real enrollments from DB
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('id, status, progress_percent, updated_at, course_id, program_id, courses(id, title, slug), programs(id, title, slug)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed', 'enrolled'])
    .order('updated_at', { ascending: false });

  // Next incomplete lesson per course
  const courseIds = (enrollments ?? []).map((e: any) => e.course_id).filter(Boolean);
  const nextLessonMap: Record<string, string> = {};

  if (courseIds.length > 0) {
    const { data: progressRows } = await db
      .from('lesson_progress')
      .select('course_id, lesson_id, completed')
      .eq('user_id', user.id)
      .in('course_id', courseIds);

    for (const courseId of courseIds) {
      const completedIds = new Set(
        (progressRows ?? [])
          .filter((p: any) => p.course_id === courseId && p.completed)
          .map((p: any) => p.lesson_id),
      );
      const { data: lessons } = await db
        .from('course_lessons')
        .select('id, title')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .limit(50);
      const first = (lessons ?? []).find((l: any) => !completedIds.has(l.id));
      if (first) nextLessonMap[courseId] = first.title;
    }
  }

  const courses = (enrollments ?? []).map((e: any) => {
    const courseData = e.courses ?? e.programs ?? null;
    return {
      id: e.course_id ?? e.program_id,
      courseId: e.course_id,
      name: courseData?.title ?? 'Untitled Course',
      slug: courseData?.slug ?? null,
      progress: Math.round(e.progress_percent ?? 0),
      status: e.status === 'completed' ? 'completed' : 'active',
      last_accessed: e.updated_at,
      next_lesson: e.course_id ? (nextLessonMap[e.course_id] ?? '') : '',
    };
  });

  const activeCourses = courses.filter((c) => c.status === 'active');
  const completedCourses = courses.filter((c) => c.status === 'completed');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/student-portal" className="hover:text-slate-700">Student Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">My Courses</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-600 mt-1">Continue your learning journey</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No courses yet</h2>
            <p className="text-slate-500 mb-6">You are not enrolled in any courses.</p>
            <Link href="/programs" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Browse Programs
            </Link>
          </div>
        ) : (
          <>
            {activeCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Courses</h2>
                <div className="space-y-4">
                  {activeCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                              <BookOpen className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-slate-900 text-lg">{course.name}</h3>
                          </div>
                          <span className="text-2xl font-bold text-blue-600">{course.progress}%</span>
                        </div>
                        <div className="mb-4">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            Last accessed {formatDate(course.last_accessed)}
                          </span>
                          <Link
                            href={course.courseId ? `/lms/courses/${course.courseId}` : `/programs/${course.slug ?? course.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Play className="w-4 h-4" />
                            Continue
                          </Link>
                        </div>
                      </div>
                      {course.next_lesson && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                          <p className="text-sm text-slate-600"><span className="font-medium">Next up:</span> {course.next_lesson}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedCourses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Completed Courses</h2>
                <div className="space-y-4">
                  {completedCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-slate-900">{course.name}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Completed</span>
                          <Link
                            href={course.courseId ? `/lms/courses/${course.courseId}` : `/programs/${course.slug ?? course.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h2 className="text-xl font-semibold mb-2">Expand Your Skills</h2>
          <p className="text-blue-100 mb-4">Browse additional courses to enhance your career.</p>
          <Link href="/programs" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50">
            Browse Programs
          </Link>
        </div>
      </div>
    </div>
  );
}
