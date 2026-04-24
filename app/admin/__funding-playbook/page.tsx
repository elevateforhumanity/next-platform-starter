import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DollarSign, CheckCircle, Globe, Building } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Funding Playbook | Admin',
};

export default async function FundingPlaybookPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  // funding_sources: id, name, code, type, state, description, max_amount, is_active, created_at
  const [
    { data: sources, count: total },
    { count: active },
    { count: federal },
    { count: state },
  ] = await Promise.all([
    db
      .from('funding_sources')
      .select('id, name, code, type, state, description, max_amount, is_active, created_at', { count: 'exact' })
      .order('name')
      .limit(100),
    db.from('funding_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('funding_sources').select('id', { count: 'exact', head: true }).eq('type', 'federal'),
    db.from('funding_sources').select('id', { count: 'exact', head: true }).eq('type', 'state'),
  ]);

  const typeColor: Record<string, string> = {
    federal: 'bg-blue-100 text-blue-800',
    state: 'bg-purple-100 text-purple-800',
    local: 'bg-green-100 text-green-800',
    private: 'bg-orange-100 text-orange-800',
    employer: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Funding Playbook' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Funding Playbook</h1>
            <p className="text-slate-600 text-sm mt-1">WIOA, DOL, grant, and employer funding sources</p>
          </div>
          <Link href="/admin/funding" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
            Funding Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sources', value: total ?? 0, icon: DollarSign, color: 'text-slate-900' },
            { label: 'Active', value: active ?? 0, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Federal', value: federal ?? 0, icon: Globe, color: 'text-blue-600' },
            { label: 'State', value: state ?? 0, icon: Building, color: 'text-purple-600' },
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
            <h2 className="font-semibold text-slate-900">Funding Sources</h2>
          </div>
          {sources && sources.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Code</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Type</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">State</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-600">Max Amount</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sources.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{s.name}</p>
                        {s.description && <p className="text-xs text-slate-500 truncate max-w-xs">{s.description}</p>}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{s.code ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[s.type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {s.type ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{s.state ?? 'National'}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {s.max_amount ? `$${Number(s.max_amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">No funding sources found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
