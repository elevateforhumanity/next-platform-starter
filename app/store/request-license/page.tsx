export const dynamic = 'force-static';

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


// /store/request-license → /store/licenses
// Preserves query params (tier, preview, etc.)
export default async function RequestLicensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(`/store/licenses${qs ? `?${qs}` : ''}`);
}
