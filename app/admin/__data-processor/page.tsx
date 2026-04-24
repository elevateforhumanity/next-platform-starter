import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { Cpu, CheckCircle, Clock, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Data Processor | Admin',
};

export default async function DataProcessorPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  // data_processing_jobs: id, name, description, status, created_at, updated_at
  const [
    { data: jobs, count: total },
    { count: pending },
    { count: completed },
    { count: failed },
  ] = await Promise.all([
    db
      .from('data_processing_jobs')
      .select('id, name, description, status, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('data_processing_jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('data_processing_jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('data_processing_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Data Processor' }]} />

        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Data Processor</h1>
          <p className="text-slate-600 text-sm mt-1">Background data processing jobs — {total ?? 0} total</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: total ?? 0, icon: Cpu, color: 'text-slate-900' },
            { label: 'Pending', value: pending ?? 0, icon: Clock, color: 'text-yellow-600' },
            { label: 'Completed', value: completed ?? 0, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Failed', value: failed ?? 0, icon: XCircle, color: 'text-red-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-slate-600">{label}</span>
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-slate-900">Processing Jobs</h2>
          </div>
          {jobs && jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Job</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Created</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs.map((j: any) => (
                    <tr key={j.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{j.name ?? 'Unnamed Job'}</p>
                        {j.description && <p className="text-xs text-slate-500 truncate max-w-xs">{j.description}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          j.status === 'completed' ? 'bg-green-100 text-green-800' :
                          j.status === 'pending'   ? 'bg-yellow-100 text-yellow-800' :
                          j.status === 'failed'    ? 'bg-red-100 text-red-800' :
                          j.status === 'running'   ? 'bg-blue-100 text-blue-800' :
                                                     'bg-gray-100 text-gray-700'
                        }`}>{j.status ?? 'unknown'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{new Date(j.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{j.updated_at ? new Date(j.updated_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">No processing jobs found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
