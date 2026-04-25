import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { GraduationCap, TrendingUp, CheckCircle, BookOpen, Award, ChevronRight, ArrowRight, Target } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'LMS Dashboard | Admin | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function LMSDashboardPage() {
  await requireAdmin();
  const db = await getAdminClient();

  const [
    { count: totalEnrollments },
    { count: activeEnrollments },
    { count: completedEnrollments },
    { count: lessonsCompleted },
    { count: checkpointsPassed },
    { count: checkpointsFailed },
    { count: certificates },
    { count: quizAttempts },
  ] = await Promise.all([
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('completed', true),
    db.from('checkpoint_scores').select('*', { count: 'exact', head: true }).eq('passed', true),
    db.from('checkpoint_scores').select('*', { count: 'exact', head: true }).eq('passed', false),
    db.from('program_completion_certificates').select('*', { count: 'exact', head: true }),
    db.from('quiz_attempts').select('*', { count: 'exact', head: true }),
  ]);

  // Per-program enrollment breakdown
  const { data: programStats } = await db
    .from('programs')
    .select('id, title, slug')
    .eq('published', true)
    .eq('is_active', true)
    .order('title')
    .limit(10);

  // Get enrollment counts per program
  const programWithCounts = await Promise.all(
    (programStats ?? []).map(async (p) => {
      const { count: active } = await db
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', p.id)
        .eq('status', 'active');
      const { count: completed } = await db
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', p.id)
        .eq('status', 'completed');
      return { ...p, active: active ?? 0, completed: completed ?? 0 };
    })
  );

  // Recent completions
  const { data: recentCompletions } = await db
    .from('program_completion_certificates')
    .select('id, issued_at, program_id, programs(title)')
    .order('issued_at', { ascending: false })
    .limit(8);

  const completionRate = totalEnrollments ? Math.round(((completedEnrollments ?? 0) / totalEnrollments) * 100) : 0;
  const checkpointPassRate = (checkpointsPassed ?? 0) + (checkpointsFailed ?? 0) > 0
    ? Math.round(((checkpointsPassed ?? 0) / ((checkpointsPassed ?? 0) + (checkpointsFailed ?? 0))) * 100)
    : 0;

  const STATS = [
    { label: 'Active Learners', value: activeEnrollments ?? 0, sub: `${totalEnrollments ?? 0} total enrolled`, icon: GraduationCap, color: 'text-blue-500', href: '/admin/enrollments' },
    { label: 'Completion Rate', value: `${completionRate}%`, sub: `${completedEnrollments ?? 0} completed`, icon: Target, color: 'text-green-500', href: '/admin/enrollments' },
    { label: 'Lessons Completed', value: lessonsCompleted ?? 0, sub: 'across all learners', icon: BookOpen, color: 'text-purple-500', href: '/admin/curriculum' },
    { label: 'Checkpoint Pass Rate', value: `${checkpointPassRate}%`, sub: `${checkpointsPassed ?? 0} passed`, icon: CheckCircle, color: 'text-amber-500', href: '/admin/quiz-results' },
    { label: 'Certificates Issued', value: certificates ?? 0, sub: 'program completions', icon: Award, color: 'text-teal-500', href: '/admin/certificates' },
    { label: 'Quiz Attempts', value: quizAttempts ?? 0, sub: 'total across all courses', icon: TrendingUp, color: 'text-slate-500', href: '/admin/quiz-results' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">Admin</p>
          <h1 className="text-xl font-bold text-slate-900">LMS Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/dashboard-enhanced" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Curriculum
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
          {/* Per-program breakdown */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Enrollments by Program</h2>
              <Link href="/admin/enrollments" className="text-sm text-brand-red-600 hover:underline">View all</Link>
            </div>
            {!programWithCounts.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No programs found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {programWithCounts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{p.title}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600 font-semibold">{p.active} active</span>
                      <span className="text-slate-400">{p.completed} done</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent certificates */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Recent Certificates</h2>
              <Link href="/admin/certificates" className="text-sm text-brand-red-600 hover:underline">View all</Link>
            </div>
            {!recentCompletions?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No certificates issued yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCompletions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{c.programs?.title ?? 'Program'}</p>
                    <p className="text-xs text-slate-400">{new Date(c.issued_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: 'All Enrollments', href: '/admin/enrollments' },
            { label: 'Lesson Progress', href: '/admin/progress' },
            { label: 'Quiz Results', href: '/admin/quiz-results' },
            { label: 'Certificates', href: '/admin/certificates' },
            { label: 'Master Dashboard', href: '/admin/master-dashboard' },
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
