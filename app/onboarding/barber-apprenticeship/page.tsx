import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BarberOnboardingRedirectPage() {
  permanentRedirect('/programs/barber-apprenticeship/orientation');
}
