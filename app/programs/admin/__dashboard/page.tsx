import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Admin Dashboard | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/admin/dashboard',
  },
  robots: { index: false, follow: false },
};

interface Program {
  id: string;
  title: string;
  slug: string;
  category: string;
  is_active: boolean;
  status?: string;
  published?: boolean;
  created_at: string;
}

export default async function ProgramAdminDashboardPage() {
  const user = await requireAdmin();
  if (!user) redirect('/login?redirect=/programs/admin/dashboard');

  const supabase = getAdminClient();

  const [programsResult, enrollmentsResult] = await Promise.all([
    supabase
      .from('programs')
      .select('id, title, slug, category, is_active, status, published, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('program_enrollments')
      .select('program_id')
      .not('program_id', 'is', null),
  ]);

  const programs: Program[] = programsResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];

  const enrollmentMap: Record<string, number> = {};
  for (const row of enrollments) {
    if (row.program_id) {
      enrollmentMap[row.program_id] = (enrollmentMap[row.program_id] ?? 0) + 1;
    }
  }

  const activeCount = programs.filter((p) => p.is_active).length;
  const publishedCount = programs.filter((p) => p.published).length;
  const totalEnrollments = enrollments.length;

  const categoryMap: Record<string, number> = {};
  for (const p of programs) {
    categoryMap[p.category] = (categoryMap[p.category] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Program Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage all programs, enrollments, and publishing status.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Programs', value: programs.length },
            { label: 'Active', value: activeCount },
            { label: 'Published', value: publishedCount },
            { label: 'Total Enrollments', value: totalEnrollments },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {Object.keys(categoryMap).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Programs by Category</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryMap).map(([cat, count]) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                >
                  {cat}
                  <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">All Programs</h2>
            <a
              href="/admin/programs/new"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Program
            </a>
          </div>
          {programs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No programs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-left">Category</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Published</th>
                    <th className="px-6 py-3 text-right">Enrollments</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {programs.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{program.title}</td>
                      <td className="px-6 py-4 text-gray-500">{program.category}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            program.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {program.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            program.published
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {program.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        {enrollmentMap[program.id] ?? 0}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(program.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/admin/programs/${program.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
