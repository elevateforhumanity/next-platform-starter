// Canonical privacy policy lives at /legal/privacy — redirect permanently.
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Elevate for Humanity',
  description: 'Privacy policy for Elevate for Humanity career training programs and services.',
  robots: { index: false, follow: false },
};

export default function PrivacyPolicyRedirect() {
  redirect('/legal/privacy');
}
