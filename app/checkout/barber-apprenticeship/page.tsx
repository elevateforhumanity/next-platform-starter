import { permanentRedirect } from 'next/navigation';

export default function BarberCheckoutRedirect() {
  permanentRedirect('/programs/barber-apprenticeship/payment-setup');
}
