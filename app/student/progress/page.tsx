import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ChevronRight, BookOpen, CheckCircle, Clock, Award, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Progress | Student Portal',
  description: 'Track your learning progress and achievements.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentProgressPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student/progress');

  // Fetch enrollments with course/program info
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(
      `
      id,
      course_id,
      program_id,
      status,
      progress_percent,
      updated_at,
      courses:course_id (id, title),
      programs:program_id (id, name, slug)
    `,
    )
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('updated_at', { ascending: false });

  // Completed lesson counts per course for this user
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('course_id, completed')
    .eq('user_id', user.id)
    .eq('completed', true);

  const completedByCourse = new Map<string, number>();
  for (const lp of lessonProgress || []) {
    if (!lp.course_id) continue;
    completedByCourse.set(lp.course_id, (completedByCourse.get(lp.course_id) ?? 0) + 1);
  }

  // Total lesson counts per enrolled course
  const courseIds = (enrollments || []).map((e) => e.course_id).filter(Boolean) as string[];
  const { data: lessonCounts } = courseIds.length
    ? await supabase.from('course_lessons').select('course_id').in('course_id', courseIds)
    : { data: [] };

  const totalByCourse = new Map<string, number>();
  for (const cl of lessonCounts || []) {
    if (!cl.course_id) continue;
    totalByCourse.set(cl.course_id, (totalByCourse.get(cl.course_id) ?? 0) + 1);
  }

  const courses = (enrollments || []).map((e) => {
    const courseId = e.course_id ?? '';
    const name =
      (e.courses as { title?: string } | null)?.title ??
      (e.programs as { name?: string } | null)?.name ??
      'Untitled Course';
    return {
      id: e.id,
      courseId,
      name,
      progress: e.progress_percent ?? 0,
      modules_completed: completedByCourse.get(courseId) ?? 0,
      total_modules: totalByCourse.get(courseId) ?? 0,
      last_activity: e.updated_at ?? new Date().toISOString(),
      status: e.status as string,
    };
  });

  const activeCourses = courses.filter((c) => c.status !== 'completed');
  const overallProgress =
    activeCourses.length > 0
      ? Math.round(activeCourses.reduce((sum, c) => sum + c.progress, 0) / activeCourses.length)
      : 0;
  const totalModules = courses.reduce((sum, c) => sum + c.modules_completed, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/learner/dashboard" className="hover:text-slate-700">
              Student Portal
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Progress</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">My Progress</h1>
          <p className="text-slate-600 mt-1">Track your learning journey</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{overallProgress}%</p>
            <p className="text-sm text-slate-500">Overall Progress</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalModules}</p>
            <p className="text-sm text-slate-500">Lessons Done</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{activeCourses.length}</p>
            <p className="text-sm text-slate-500">Active Courses</p>
          </div>
        </div>

        {/* Course Progress */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No courses enrolled yet.</p>
            <Link href="/programs" className="text-blue-600 font-medium hover:text-blue-700">
              Browse Programs
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Course Progress</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {courses.map((course) => (
                <div key={course.id} className="px-6 py-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{course.name}</h3>
                        {course.total_modules > 0 && (
                          <p className="text-sm text-slate-500">
                            {course.modules_completed} of {course.total_modules} lessons completed
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{course.progress}%</span>
                  </div>

                  <div className="mb-4">
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-4 h-4" />
                      Last activity: {formatDate(course.last_activity)}
                    </span>
                    {course.courseId && (
                      <Link
                        href={`/lms/courses/${course.courseId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Continue Learning
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
