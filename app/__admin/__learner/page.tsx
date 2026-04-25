export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { User } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Learner Management | Elevate Admin',
};

export default async function LearnerPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = getAdminClient();

  const { data: learners } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Learners' }]} />

        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Learner Management</h1>
            <p className="text-slate-700 mt-1">{learners?.length ?? 0} learners</p>
          </div>
          <Link
            href="/admin/students"
            className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue-700"
          >
            Full Student View
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-700">Learner</th>
                <th className="text-left px-6 py-3 font-medium text-slate-700">Email</th>
                <th className="text-left px-6 py-3 font-medium text-slate-700">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(learners ?? []).map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center text-brand-blue-600">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-900">{l.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{l.email ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/learner/${l.id}`}
                      className="text-brand-blue-600 hover:text-brand-blue-800 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!learners || learners.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-700">
                    No learners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
