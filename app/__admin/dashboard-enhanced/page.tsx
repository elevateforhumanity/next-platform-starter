import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { BookOpen, FileText, AlertCircle, Award, Edit3, CheckSquare, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Curriculum Dashboard | Admin | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function DashboardEnhancedPage() {
  await requireAdmin();
  const db = await getAdminClient();

  const [
    { count: totalCourses },
    { count: publishedCourses },
    { count: totalLessons },
    { count: totalSubmissions },
    { count: pendingSubmissions },
    { count: totalQuizAttempts },
    { count: passedQuizzes },
    { count: totalCertificates },
  ] = await Promise.all([
    db.from('courses').select('*', { count: 'exact', head: true }),
    db.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('course_lessons').select('*', { count: 'exact', head: true }),
    db.from('step_submissions').select('*', { count: 'exact', head: true }),
    db.from('step_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('quiz_attempts').select('*', { count: 'exact', head: true }),
    db.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('passed', true),
    db.from('program_completion_certificates').select('*', { count: 'exact', head: true }),
  ]);

  const { data: pendingReview } = await db
    .from('step_submissions')
    .select('id, step_type, submitted_at')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })
    .limit(8);

  const { data: courses } = await db
    .from('courses')
    .select('id, title, status')
    .order('created_at', { ascending: false })
    .limit(10);

  const passRate = totalQuizAttempts ? Math.round(((passedQuizzes ?? 0) / totalQuizAttempts) * 100) : 0;

  const STATS = [
    { label: 'Total Courses', value: totalCourses ?? 0, sub: `${publishedCourses ?? 0} published`, icon: BookOpen, color: 'text-blue-500', href: '/admin/curriculum' },
    { label: 'Total Lessons', value: totalLessons ?? 0, sub: 'across all courses', icon: FileText, color: 'text-purple-500', href: '/admin/curriculum' },
    { label: 'Pending Reviews', value: pendingSubmissions ?? 0, sub: 'lab & assignment submissions', icon: AlertCircle, color: (pendingSubmissions ?? 0) > 0 ? 'text-red-500' : 'text-green-500', href: '/admin/submissions' },
    { label: 'Quiz Pass Rate', value: `${passRate}%`, sub: `${totalQuizAttempts ?? 0} attempts`, icon: CheckSquare, color: 'text-amber-500', href: '/admin/quiz-results' },
    { label: 'Certificates Issued', value: totalCertificates ?? 0, sub: 'program completions', icon: Award, color: 'text-green-500', href: '/admin/certificates' },
    { label: 'Total Submissions', value: totalSubmissions ?? 0, sub: 'labs + assignments', icon: Edit3, color: 'text-slate-500', href: '/admin/submissions' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">Admin</p>
          <h1 className="text-xl font-bold text-slate-900">Curriculum Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/curriculum" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Edit3 className="w-4 h-4" /> Builder
          </Link>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Main Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} href={s.href} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-6 h-6 ${s.color}`} />
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{s.value.toLocaleString()}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Pending Reviews
                {(pendingSubmissions ?? 0) > 0 && <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{pendingSubmissions}</span>}
              </h2>
              <Link href="/admin/submissions" className="text-sm text-brand-red-600 hover:underline">View all</Link>
            </div>
            {!pendingReview?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No pending submissions.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReview.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 capitalize">{s.step_type ?? 'Submission'}</p>
                      <p className="text-xs text-slate-400">{new Date(s.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/admin/submissions/${s.id}`} className="text-xs font-semibold text-brand-red-600 hover:underline">Review</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Courses</h2>
              <Link href="/admin/curriculum" className="text-sm text-brand-red-600 hover:underline">Manage</Link>
            </div>
            {!courses?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No courses found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {courses.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[220px]">{c.title}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.status === 'published' ? 'bg-green-50 text-green-700' : c.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: 'Curriculum Builder', href: '/admin/curriculum' },
            { label: 'Quiz Results', href: '/admin/quiz-results' },
            { label: 'Certificates', href: '/admin/certificates' },
            { label: 'Submissions', href: '/admin/submissions' },
            { label: 'LMS Dashboard', href: '/admin/lms-dashboard' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {l.label} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
