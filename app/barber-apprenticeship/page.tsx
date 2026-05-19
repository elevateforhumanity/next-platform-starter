import { permanentRedirect } from 'next/navigation';

// Canonical URL is /programs/barber-apprenticeship
export default function BarberApprenticeshipRedirect() {
  permanentRedirect('/programs/barber-apprenticeship');
}
