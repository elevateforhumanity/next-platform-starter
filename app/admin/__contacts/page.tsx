import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Mail, Phone, Building2, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contacts | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function AdminContactsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from('marketing_contacts')
    .select('id, first_name, last_name, email, phone, company, contact_type, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);

  const rows = contacts ?? [];
  const byType: Record<string, number> = {};
  for (const c of rows) {
    const t = c.contact_type ?? 'unknown';
    byType[t] = (byType[t] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
            <p className="text-slate-500 text-sm mt-0.5">{rows.length} total contacts</p>
          </div>
          <Link
            href="/admin/crm/contacts/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(byType).map(([type, count]) => (
              <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                <Users className="w-3.5 h-3.5" />
                {type} <span className="text-slate-400">({count})</span>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No contacts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Phone</th>
                    <th className="px-6 py-3 text-left">Company</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <Link href={`/admin/crm/contacts/${c.id}`} className="hover:text-blue-600">
                          {c.first_name} {c.last_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-blue-600">
                          <Mail className="w-3.5 h-3.5" />{c.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{c.phone}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {c.company ? (
                          <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{c.company}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{c.contact_type ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>{c.status ?? 'unknown'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
