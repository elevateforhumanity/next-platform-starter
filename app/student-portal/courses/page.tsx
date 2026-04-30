import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ChevronRight, BookOpen, Clock, Play, CheckCircle, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Courses | Student Portal',
  description: 'Access your enrolled courses.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentCoursesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal/courses');

  // Fetch enrollments with course and program info
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
      courses:course_id (id, title, description),
      programs:program_id (id, name, slug)
    `,
    )
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'completed'])
    .order('updated_at', { ascending: false });

  const courses = (enrollments || []).map((e) => {
    const courseId = e.course_id ?? '';
    const name =
      (e.courses as { title?: string } | null)?.title ??
      (e.programs as { name?: string } | null)?.name ??
      'Untitled Course';
    const progress = e.progress_percent ?? 0;
    const isCompleted = e.status === 'completed' || progress >= 100;
    return {
      id: e.id,
      courseId,
      name,
      progress,
      last_accessed: e.updated_at ?? new Date().toISOString(),
      status: isCompleted ? 'completed' : 'active',
    };
  });

  const activeCourses = courses.filter((c) => c.status === 'active');
  const completedCourses = courses.filter((c) => c.status === 'completed');

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/student-portal" className="hover:text-gray-700">
              Student Portal
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">My Courses</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">Continue your learning journey</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No courses enrolled yet.</p>
            <Link href="/programs" className="text-blue-600 font-medium hover:text-blue-700">
              Browse Programs
            </Link>
          </div>
        ) : (
          <>
            {/* Active Courses */}
            {activeCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Courses</h2>
                <div className="space-y-4">
                  {activeCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                              <BookOpen className="w-7 h-7 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{course.name}</h3>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-blue-600">
                            {course.progress}%
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            Last accessed {formatDate(course.last_accessed)}
                          </span>
                          <Link
                            href={
                              course.courseId
                                ? `/lms/courses/${course.courseId}`
                                : '/lms/dashboard'
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Play className="w-4 h-4" />
                            Continue
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Courses */}
            {completedCourses.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Courses</h2>
                <div className="space-y-4">
                  {completedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            Completed
                          </span>
                          {course.courseId && (
                            <Link
                              href={`/lms/courses/${course.courseId}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Review
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Browse More */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h2 className="text-xl font-semibold mb-2">Expand Your Skills</h2>
          <p className="text-blue-100 mb-4">Browse additional courses to enhance your career.</p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Browse Programs
          </Link>
        </div>
      </div>
    </div>
  );
}
