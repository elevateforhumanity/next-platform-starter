import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  robots: { index: false, follow: false },
};

export default function BarberPwaTrainingRedirectPage() {
  permanentRedirect('/programs/barber-apprenticeship/orientation');
}
