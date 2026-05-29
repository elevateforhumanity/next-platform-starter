export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The host salon application form lives at cosmetology-partner-shop/apply.
// This route is the canonical public-facing URL — redirect to the form.
export default function CosmetologyApprenticeshipApplyRedirect() {
  redirect('/partners/cosmetology-partner-shop/apply');
}
