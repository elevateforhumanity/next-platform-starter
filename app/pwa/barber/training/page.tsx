import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BarberPwaTrainingRedirectPage() {
  redirect('/programs/barber-apprenticeship/orientation');
}
