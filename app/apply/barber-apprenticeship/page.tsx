import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

// Canonical apply URL is /programs/barber-apprenticeship/apply
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  permanentRedirect('/programs/barber-apprenticeship/apply');
}
