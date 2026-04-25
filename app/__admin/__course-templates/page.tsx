import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, Globe, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Course Templates | Admin',
};

export default async function CourseTemplatesPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  // course_templates: id, name, description, category, structure, is_public, created_by, created_at
  const [
    { data: templates, count: total },
    { count: publicCount },
    { count: privateCount },
  ] = await Promise.all([
    db
      .from('course_templates')
      .select('id, name, description, category, is_public, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('course_templates').select('id', { count: 'exact', head: true }).eq('is_public', true),
    db.from('course_templates').select('id', { count: 'exact', head: true }).eq('is_public', false),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Course Templates' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Course Templates</h1>
            <p className="text-slate-600 text-sm mt-1">{total ?? 0} templates</p>
          </div>
          <Link href="/admin/course-studio" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
            Create Template
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: total ?? 0, icon: BookOpen, color: 'text-slate-900' },
            { label: 'Public', value: publicCount ?? 0, icon: Globe, color: 'text-green-600' },
            { label: 'Private', value: privateCount ?? 0, icon: Lock, color: 'text-slate-500' },
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
            <h2 className="font-semibold text-slate-900">All Templates</h2>
          </div>
          {templates && templates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Visibility</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Created</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {templates.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{t.name ?? 'Untitled'}</p>
                        {t.description && <p className="text-xs text-slate-500 truncate max-w-xs">{t.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{t.category ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 text-xs font-medium ${t.is_public ? 'text-green-700' : 'text-slate-500'}`}>
                          {t.is_public ? <><Globe className="w-3.5 h-3.5" />Public</> : <><Lock className="w-3.5 h-3.5" />Private</>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/course-templates/${t.id}`} className="text-brand-blue-600 hover:underline text-xs font-medium">Edit →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">No course templates found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
