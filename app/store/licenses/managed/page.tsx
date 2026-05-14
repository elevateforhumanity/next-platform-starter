export const dynamic = 'force-static';

import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


// Legacy route — redirects to the admin licenses page
export default async function LegacyManagedLicensePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; license_id?: string }>;
}) {
  const { reason, license_id } = await searchParams;
  const params = new URLSearchParams();
  if (reason) params.set('reason', reason);
  if (license_id) params.set('license_id', license_id);
  const qs = params.toString();
  permanentRedirect(`/admin/licenses${qs ? `?${qs}` : ''}`);
}
