import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BarberPwaHomePage() {
  redirect('/pwa/barber/onboarding');
}
