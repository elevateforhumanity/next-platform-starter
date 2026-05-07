import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Temporarily redirects to /apply — FSSA IMPACT content archived in _archived/apply/
export default function ApplyImpactPage() {
  redirect('/apply');
}
