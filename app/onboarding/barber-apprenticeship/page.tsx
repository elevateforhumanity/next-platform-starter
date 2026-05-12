import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BarberOnboardingRedirectPage() {
  redirect('/programs/barber-apprenticeship/orientation');
}
