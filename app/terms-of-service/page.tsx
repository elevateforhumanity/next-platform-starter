// Canonical terms page lives at /terms — redirect permanently.
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Elevate for Humanity',
  description: 'Terms of service for Elevate for Humanity career training programs and services.',
  robots: { index: false, follow: false },
};

export default function TermsOfServiceRedirect() {
  redirect('/terms');
}
