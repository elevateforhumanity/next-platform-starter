import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BarberPwaProfileRedirectPage() {
  redirect('/student-portal/profile');
}
