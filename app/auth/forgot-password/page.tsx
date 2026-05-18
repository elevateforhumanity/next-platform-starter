import { permanentRedirect } from 'next/navigation';

// Canonical: /reset-password
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export default function Page() {
  permanentRedirect('/reset-password');
}
