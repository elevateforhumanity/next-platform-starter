import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  new:            'New',
  contacted:      'Contacted',
  docs_pending:   'Docs Pending',
  docs_received:  'Docs Received',
  in_preparation: 'In Preparation',
  filed:          'Filed',
  completed:      'Completed',
  lost:           'Lost',
};

const STATUS_COLORS: Record<string, string> = {
  new:            'bg-brand-blue-100 text-brand-blue-800',
  contacted:      'bg-yellow-100 text-yellow-800',
  docs_pending:   'bg-orange-100 text-orange-800',
  docs_received:  'bg-purple-100 text-purple-800',
  in_preparation: 'bg-indigo-100 text-indigo-800',
  filed:          'bg-teal-100 text-teal-800',
  completed:      'bg-green-100 text-green-800',
  lost:           'bg-slate-100 text-slate-500',
};

export default async function SupersonicClientIntakePage() {
  // Auth gate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login?redirect=/supersonic-fast-cash/admin/client-intake');

  const db = await getAdminClient();
  if (!db) redirect('/login?redirect=/supersonic-fast-cash/admin/client-intake');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff', 'tax_preparer'].includes(profile.role)) {
    redirect('/supersonic-fast-cash?error=unauthorized');
  }

  // Fetch leads
  const { data: leads, error: leadsErr } = await db
    .from('sfc_leads')
    .select('id, created_at, first_name, last_name, email, phone, service_type, state, status, source, refund_estimate, needs_refund_advance')
    .order('created_at', { ascending: false })
    .limit(200);

  if (leadsErr) {
    // Table may not exist yet — show a helpful message
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-black text-slate-900 mb-4">Client Intake Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
          <p className="font-semibold">Database table not yet applied.</p>
          <p className="text-sm mt-2">
            Apply migration <code className="font-mono bg-yellow-100 px-1 rounded">20260624000004_sfc_leads.sql</code> in the
            Supabase Dashboard SQL Editor to activate this dashboard.
          </p>
        </div>
      </main>
    );
  }

  const rows = leads ?? [];

  // Stats
  const countByStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Client Intake Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Supersonic Fast Cash — {rows.length} leads</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-brand-red-600 hover:underline"
        >
          ← Main Admin
        </Link>
      </div>

      {/* Status summary chips */}
      <section className="flex flex-wrap gap-3">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${STATUS_COLORS[key]}`}>
            {label}: {countByStatus[key] ?? 0}
          </div>
        ))}
      </section>

      {/* Lead table */}
      {rows.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          No leads yet. Leads are created when users submit the intake form on any SFC page.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Contact', 'Service', 'State', 'Source', 'Refund Est.', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="text-xs">{lead.email}</div>
                    {lead.phone && <div className="text-xs text-slate-400">{lead.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize whitespace-nowrap">
                    {lead.service_type?.replace(/_/g, ' ') ?? '—'}
                    {lead.needs_refund_advance && (
                      <span className="ml-1.5 text-xs bg-brand-red-100 text-brand-red-700 px-1.5 py-0.5 rounded-full font-semibold">+Adv</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.state ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs capitalize">{lead.source}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.refund_estimate != null ? `$${Number(lead.refund_estimate).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        To update a lead status, use the Supabase Dashboard or the admin API until the full CRM is wired.
      </p>
    </main>
  );
}
