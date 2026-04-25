import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GraduationCap, BookOpen, Award, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grades & Progress | Student Portal',
  description: 'View your academic grades and progress.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentPortalGradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal/grades');

  // 1. Checkpoint scores (primary — real quiz/exam scores from LMS engine)
  const { data: checkpointScores } = await supabase
    .from('checkpoint_scores')
    .select(`
      id, score, passing_score, passed, attempt_number, created_at, course_id, module_order,
      lesson:curriculum_lessons(title, step_type),
      course:courses(title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 2. Lesson progress (completion counts)
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('id, course_slug, lesson_id, completed, completed_at')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false });

  // 3. Training enrollments (program-level progress)
  const { data: trainingEnrollments } = await supabase
    .from('training_enrollments')
    .select('id, progress, status, final_grade, completed_at, program:programs(title), course:training_courses(course_name)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  // 4. Program enrollments (canonical)
  const { data: programEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, status, completed_at, program:programs(title)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  // 5. Supplementary grades table (may be empty)
  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('id, grade, score, max_score, status, graded_at, courses:course_id(name, code), assignments:assignment_id(title)')
    .eq('student_id', user.id)
    .order('graded_at', { ascending: false });

  const scores = checkpointScores ?? [];
  const progress = lessonProgress ?? [];
  const trainEnrollments = trainingEnrollments ?? [];
  const progEnrollments = programEnrollments ?? [];
  const grades = gradesRaw ?? [];

  // Stats
  const completedCourses = [
    ...trainEnrollments.filter((e: any) => e.status === 'completed'),
    ...progEnrollments.filter((e: any) => e.status === 'completed'),
  ];
  const passedCheckpoints = scores.filter((s: any) => s.passed);
  const avgCheckpointScore = scores.length > 0
    ? Math.round(scores.reduce((sum: number, s: any) => sum + s.score, 0) / scores.length)
    : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-slate-700';
    const g = grade.toUpperCase();
    if (g.startsWith('A')) return 'text-brand-green-600';
    if (g.startsWith('B')) return 'text-brand-blue-600';
    if (g.startsWith('C')) return 'text-yellow-600';
    if (g.startsWith('D')) return 'text-brand-orange-600';
    return 'text-red-600';
  };

  const hasAnyData = scores.length > 0 || progress.length > 0 || trainEnrollments.length > 0 || progEnrollments.length > 0 || grades.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/student-portal-page-3.jpg" alt="Grades" fill sizes="100vw" className="object-cover" priority />
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Student Portal', href: '/student-portal' }, { label: 'Grades & Progress' }]} />

        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Grades &amp; Progress</h1>
          <p className="text-slate-700 mt-1">Your academic performance across all programs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5 text-center">
            <GraduationCap className="w-7 h-7 text-brand-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-brand-blue-600">{completedCourses.length}</p>
            <p className="text-xs text-slate-700 mt-0.5">Courses Completed</p>
          </div>
          <div className="bg-white rounded-xl border p-5 text-center">
            <BookOpen className="w-7 h-7 text-brand-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-brand-green-600">{progress.length}</p>
            <p className="text-xs text-slate-700 mt-0.5">Lessons Completed</p>
          </div>
          <div className="bg-white rounded-xl border p-5 text-center">
            <CheckCircle className="w-7 h-7 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{passedCheckpoints.length}<span className="text-sm text-slate-700">/{scores.length}</span></p>
            <p className="text-xs text-slate-700 mt-0.5">Checkpoints Passed</p>
          </div>
          <div className="bg-white rounded-xl border p-5 text-center">
            <BarChart3 className="w-7 h-7 text-brand-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-brand-orange-600">{avgCheckpointScore !== null ? `${avgCheckpointScore}%` : '--'}</p>
            <p className="text-xs text-slate-700 mt-0.5">Avg Quiz Score</p>
          </div>
        </div>

        {!hasAnyData && (
          <div className="text-center py-16 border rounded-xl">
            <TrendingUp className="w-14 h-14 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No grades yet</h3>
            <p className="text-slate-700 text-sm mb-4">Complete lessons and quizzes to see your progress here.</p>
            <Link href="/lms/courses" className="text-brand-blue-600 hover:underline text-sm font-medium">Browse your courses →</Link>
          </div>
        )}

        {/* Program / Course Progress */}
        {(trainEnrollments.length > 0 || progEnrollments.length > 0) && (
          <section className="rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-blue-600" /> Program Progress
            </h2>
            <div className="space-y-3">
              {trainEnrollments.map((e: any) => {
                const name = e.program?.title ?? e.course?.course_name ?? 'Program';
                const pct = e.progress ?? 0;
                return (
                  <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-slate-900 truncate">{name}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{pct}% complete</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {e.final_grade ? (
                        <span className={`text-xl font-bold ${getGradeColor(e.final_grade)}`}>{e.final_grade}</span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          e.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-blue-100 text-brand-blue-700'
                        }`}>
                          {e.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      )}
                      {e.completed_at && <p className="text-xs text-slate-700 mt-1">{formatDate(e.completed_at)}</p>}
                    </div>
                  </div>
                );
              })}
              {progEnrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium text-slate-900">{e.program?.title ?? 'Program'}</p>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      e.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-blue-100 text-brand-blue-700'
                    }`}>
                      {e.status === 'completed' ? 'Completed' : 'Enrolled'}
                    </span>
                    {e.completed_at && <p className="text-xs text-slate-700 mt-1">{formatDate(e.completed_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Checkpoint / Quiz Scores */}
        {scores.length > 0 && (
          <section className="rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" /> Quiz &amp; Checkpoint Scores
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Lesson</th>
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Course</th>
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Score</th>
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Result</th>
                    <th className="py-2.5 font-medium text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {s.lesson?.title ?? `Module ${s.module_order} Checkpoint`}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{s.course?.title ?? '--'}</td>
                      <td className="py-3 pr-4">
                        <span className={`font-semibold ${s.score >= 90 ? 'text-brand-green-600' : s.score >= 70 ? 'text-brand-blue-600' : 'text-red-600'}`}>
                          {s.score}%
                        </span>
                        <span className="text-slate-700 text-xs ml-1">(pass: {s.passing_score}%)</span>
                      </td>
                      <td className="py-3 pr-4">
                        {s.passed
                          ? <span className="inline-flex items-center gap-1 text-brand-green-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Passed</span>
                          : <span className="inline-flex items-center gap-1 text-red-600 font-medium"><XCircle className="w-3.5 h-3.5" /> Failed</span>}
                      </td>
                      <td className="py-3 text-slate-700">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Supplementary grades table */}
        {grades.length > 0 && (
          <section className="rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-green-600" /> Assignment Grades
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Assignment</th>
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Course</th>
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Score</th>
                    <th className="py-2.5 pr-4 font-medium text-slate-700">Grade</th>
                    <th className="py-2.5 font-medium text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g: any) => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">{g.assignments?.title ?? 'Assignment'}</td>
                      <td className="py-3 pr-4 text-slate-700">{g.courses?.name ?? g.courses?.code ?? '--'}</td>
                      <td className="py-3 pr-4">
                        {g.score !== null && g.max_score
                          ? <span>{g.score}/{g.max_score} <span className="text-slate-700">({Math.round((g.score / g.max_score) * 100)}%)</span></span>
                          : <span className="text-slate-700">--</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {g.grade
                          ? <span className={`font-semibold ${getGradeColor(g.grade)}`}>{g.grade}</span>
                          : <span className="text-slate-700">--</span>}
                      </td>
                      <td className="py-3 text-slate-700">{g.graded_at ? formatDate(g.graded_at) : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Lesson completion log */}
        {progress.length > 0 && (
          <section className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-brand-green-600" /> Completed Lessons
              <span className="ml-auto text-sm font-normal text-slate-700">{progress.length} total</span>
            </h2>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {progress.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-900">{p.lesson_id}</span>
                  </div>
                  <span className="text-xs text-slate-700 flex-shrink-0 ml-4">
                    {p.completed_at ? formatDate(p.completed_at) : ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
