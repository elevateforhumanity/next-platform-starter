import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileQuestion, CheckSquare, Clock, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Assessment Bank | Admin | Elevate For Humanity',
  description: 'Manage quizzes and assessments for courses.',
};

export default async function AssessmentBankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = await requireAdminClient();

  const [quizzesRes, questionsRes] = await Promise.all([
    db.from('quizzes')
      .select('id, title, description, passing_score, time_limit_minutes, max_attempts, course_id, courses ( title )')
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('quiz_questions').select('quiz_id').limit(10000),
  ]);

  const quizzes = quizzesRes.data ?? [];
  const allQuestions = questionsRes.data ?? [];

  const qCountByQuiz: Record<string, number> = {};
  for (const q of allQuestions) {
    if (q.quiz_id) qCountByQuiz[q.quiz_id] = (qCountByQuiz[q.quiz_id] ?? 0) + 1;
  }

  const totalQuestions = allQuestions.length;
  const avgPassRate = quizzes.length > 0
    ? Math.round(quizzes.reduce((s, q) => s + (q.passing_score ?? 70), 0) / quizzes.length)
    : 0;
  const timedQuizzes = quizzes.filter(q => q.time_limit_minutes);
  const avgDuration = timedQuizzes.length > 0
    ? Math.round(timedQuizzes.reduce((s, q) => s + (q.time_limit_minutes ?? 0), 0) / timedQuizzes.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/studio" className="hover:text-slate-700">Course Builder</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Assessment Bank</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assessment Bank</h1>
            <p className="text-sm text-slate-500 mt-1">Quizzes and exams across all courses</p>
          </div>
          <Link
            href="/admin/studio"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileQuestion, color: 'blue', value: quizzes.length, label: 'Assessments' },
            { icon: CheckSquare, color: 'emerald', value: totalQuestions, label: 'Questions' },
            { icon: Clock, color: 'amber', value: avgDuration > 0 ? `${avgDuration}m` : '—', label: 'Avg. Duration' },
            { icon: CheckSquare, color: 'purple', value: quizzes.length > 0 ? `${avgPassRate}%` : '—', label: 'Avg. Pass Threshold' },
          ].map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${color}-50 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">No assessments yet</h3>
            <p className="text-sm text-slate-500 mb-6">Create quizzes and exams from the Course Builder.</p>
            <Link
              href="/admin/studio"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Go to Course Builder
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Assessment</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Course</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Questions</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Pass %</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Time Limit</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizzes.map((quiz) => {
                  const course = quiz.courses as { title: string } | null;
                  return (
                    <tr key={quiz.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href="/admin/studio"
                          className="font-medium text-slate-900 hover:text-brand-blue-600"
                        >
                          {quiz.title}
                        </Link>
                        {quiz.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{quiz.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {course?.title ?? <span className="text-slate-400 italic">No course</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{qCountByQuiz[quiz.id] ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{quiz.passing_score ?? 70}%</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{quiz.max_attempts ?? '∞'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
