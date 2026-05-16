import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import BulkCertificationsClient from './BulkCertificationsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certifications/bulk',
  },
  title: 'Bulk Certification Management | Elevate For Humanity',
  description: 'Manage certifications for multiple participants at once.',
};

export default async function BulkCertificationsPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const { data: certificationTypes } = await supabase
    .from('certification_types')
    .select('id, name, provider, validity_months')
    .order('name');

  const { data: rawPendingCerts, count: pendingCount } = await supabase
    .from('user_certifications')
    .select('id, user_id, certification_type_id, status, earned_date', { count: 'exact' })
    .eq('status', 'pending')
    .limit(20);

  // Hydrate profiles (no FK from user_certifications.user_id to profiles)
  const certUserIds = [
    ...new Set((rawPendingCerts ?? []).map((c) => c.user_id).filter(Boolean)),
  ];
  const { data: certProfiles } = certUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', certUserIds)
    : { data: [] };

  const certProfileMap = Object.fromEntries((certProfiles ?? []).map((p) => [p.id, p]));
  const pendingCertifications = (rawPendingCerts ?? []).map((c) => ({
    ...c,
    profiles: certProfileMap[c.user_id] ?? null,
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/certificates" className="hover:text-primary">Certificates</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Bulk Management</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Bulk Certification Management</h1>
          <p className="text-slate-700 mt-2">Approve, update, or manage certifications in bulk</p>
        </div>

        <BulkCertificationsClient
          pendingCertifications={pendingCertifications}
          certificationTypes={certificationTypes ?? []}
          pendingCount={pendingCount ?? 0}
        />
      </div>
    </div>
  );
}
