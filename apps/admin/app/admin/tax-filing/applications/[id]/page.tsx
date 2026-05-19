import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TaxApplicationEditForm from './TaxApplicationEditForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tax Application | Admin' };

export default async function TaxApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: app } = await db
    .from('tax_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!app) notFound();

  const fields: [string, unknown][] = [
    ['Applicant Name', app.full_name ?? `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()],
    ['Email', app.email],
    ['Phone', app.phone],
    ['Tax Year', app.tax_year],
    ['Filing Type', app.filing_type],
    ['Status', app.status],
    ['Assigned To', app.assigned_to],
    ['Submitted', app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'],
    ['Notes', app.notes],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Tax Filing', href: '/admin/tax-filing' },
          { label: 'Applications', href: '/admin/tax-filing/applications' },
          { label: (app.full_name ?? app.email ?? id) as string },
        ]} />

        <div className="flex items-center justify-between mt-6 mb-8">
          <div>
            <Link href="/admin/tax-filing/applications" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              {(app.full_name ?? `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()) as string}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{app.email as string}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            app.status === 'approved' || app.status === 'completed' ? 'bg-green-100 text-green-700' :
            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>{app.status as string}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Application Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {fields.map(([label, value]) => value ? (
              <div key={label as string}>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label as string}</dt>
                <dd className="mt-1 text-sm text-slate-900">{String(value)}</dd>
              </div>
            ) : null)}
          </dl>
        </div>

        <TaxApplicationEditForm
          applicationId={id}
          currentStatus={app.status as string}
          currentNotes={(app.notes as string) ?? null}
        />
      </div>
    </div>
  );
}
