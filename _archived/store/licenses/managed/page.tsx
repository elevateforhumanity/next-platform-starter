export const dynamic = 'force-static';
export const revalidate = 3600;

import { redirect } from 'next/navigation';

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
  redirect(`/admin/licenses${qs ? `?${qs}` : ''}`);
}
