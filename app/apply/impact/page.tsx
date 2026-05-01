import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Redirect /apply/impact to the canonical FSSA application page.
export default function ApplyImpactRedirect() {
  redirect('/apply/fssa');
}
