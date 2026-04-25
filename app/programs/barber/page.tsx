import { redirect } from 'next/navigation';

// /programs/barber is an alias — canonical page is /programs/barber-apprenticeship
export default function BarberRedirect() {
  redirect('/programs/barber-apprenticeship');
}
