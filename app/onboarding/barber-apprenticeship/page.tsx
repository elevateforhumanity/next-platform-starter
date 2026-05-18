import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export default function BarberOnboardingRedirectPage() {
  permanentRedirect('/programs/barber-apprenticeship/orientation');
}
