import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Governance',
  robots: { index: false, follow: false },
};

export default function GovernancePage() {
  permanentRedirect('/legal/governance');
}
