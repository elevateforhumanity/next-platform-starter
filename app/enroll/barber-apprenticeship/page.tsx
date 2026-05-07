import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  permanentRedirect(ROUTES.BARBER_APPLY);
}
