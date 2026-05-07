import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import ScormUploadPanel from './ScormUploadPanel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Course Import | Admin | Elevate For Humanity' };

export default async function CourseImportPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: packages } = await db
    .from('scorm_packages')
    .select('id, title, version, status, created_at, file_size')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Course Import' }]} />
      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Course Import</h1>
        <p className="text-slate-500 text-sm mt-1">Upload SCORM packages to make them available in the LMS.</p>
      </div>

      {/* Upload panel — calls /api/scorm/upload */}
      <ScormUploadPanel />

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Uploaded Packages</h2>
        {!packages || packages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No SCORM packages uploaded yet.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Title', 'Version', 'Status', 'Size', 'Uploaded'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(packages as any[]).map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{pkg.title}</td>
                    <td className="px-4 py-3 text-slate-500">{pkg.version ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {pkg.status ?? 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{pkg.file_size ? `${(pkg.file_size / 1024 / 1024).toFixed(1)} MB` : '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(pkg.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
