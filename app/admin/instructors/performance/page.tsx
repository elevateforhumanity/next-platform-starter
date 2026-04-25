import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/instructors/performance' },
  title: 'Instructor Performance | Elevate For Humanity',
  description: 'Monitor instructor performance and teaching metrics.',
};

export default async function InstructorPerformancePage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  const { data: instructors } = await db
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'instructor')
    .order('full_name')
    .limit(50);

  // For each instructor compute real metrics from program_enrollments and lesson_progress
  const instructorStats = await Promise.all(
    (instructors || []).map(async (inst: any) => {
      // Programs this instructor is assigned to
      const { data: assignments } = await db
        .from('program_enrollments')
        .select('user_id, status, program_id')
        .eq('instructor_id', inst.id);

      const totalStudents = assignments?.length || 0;
      const completed = assignments?.filter((a: any) => a.status === 'completed').length || 0;
      const completionRate = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;

      // Lesson progress rows for students in this instructor's programs
      const studentIds = [...new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean))];
      let avgScore = 0;
      if (studentIds.length > 0) {
        const { data: scores } = await db
          .from('checkpoint_scores')
          .select('score')
          .in('user_id', studentIds.slice(0, 100));
        const validScores = (scores || []).map((s: any) => s.score).filter((s: any) => s != null);
        avgScore = validScores.length > 0
          ? Math.round(validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length)
          : 0;
      }

      return { ...inst, totalStudents, completionRate, avgScore };
    })
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/instructors" className="hover:text-primary">Instructors</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Performance</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Instructor Performance</h1>
          <p className="text-slate-700 mt-2">Teaching effectiveness and student outcomes</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Instructor Metrics</h2></div>
          <div className="divide-y">
            {instructorStats.length > 0 ? instructorStats.map((inst: any) => (
              <div key={inst.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-blue-600 font-medium">{(inst.full_name || 'I')[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{inst.full_name || 'Instructor'}</p>
                    <p className="text-sm text-slate-700">{inst.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{inst.totalStudents}</p>
                    <p className="text-slate-700">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{inst.completionRate}%</p>
                    <p className="text-slate-700">Completion</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{inst.avgScore > 0 ? `${inst.avgScore}%` : '—'}</p>
                    <p className="text-slate-700">Avg Score</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-700">No instructors found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
