export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CosmetologyApprenticeshipSignMouRedirect() {
  redirect('/partners/cosmetology-partner-shop/sign-mou');
}
