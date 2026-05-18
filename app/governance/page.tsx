import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Governance',
  robots: { index: false, follow: false },
};

export default function GovernancePage() {
  permanentRedirect('/legal/governance');
}
