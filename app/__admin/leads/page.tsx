import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Target, Mail, Phone, Plus, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leads | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  appointment_set: 'bg-orange-100 text-orange-700',
  application_started: 'bg-indigo-100 text-indigo-700',
  enrolled: 'bg-green-100 text-green-700',
  not_interested: 'bg-slate-100 text-slate-500',
  unqualified: 'bg-red-100 text-red-600',
};

export default async function AdminLeadsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, program_interest, source, status, created_at, last_contacted_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = leads ?? [];
  const newCount = rows.filter((l) => l.status === 'new').length;
  const enrolledCount = rows.filter((l) => l.status === 'enrolled').length;
  const qualifiedCount = rows.filter((l) => l.status === 'qualified').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
            <p className="text-slate-500 text-sm mt-0.5">{rows.length} total leads</p>
          </div>
          <Link
            href="/admin/crm/leads/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: rows.length, icon: Target },
            { label: 'New', value: newCount, icon: TrendingUp },
            { label: 'Qualified', value: qualifiedCount, icon: TrendingUp },
            { label: 'Enrolled', value: enrolledCount, icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-3xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No leads yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Phone</th>
                    <th className="px-6 py-3 text-left">Program Interest</th>
                    <th className="px-6 py-3 text-left">Source</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <Link href={`/admin/crm/leads/${l.id}`} className="hover:text-blue-600">
                          {l.first_name} {l.last_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-blue-600">
                          <Mail className="w-3.5 h-3.5" />{l.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {l.phone ? <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{l.phone}</span> : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{l.program_interest ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{l.source ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(l.created_at).toLocaleDateString()}
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
