import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function BarberInquiryRedirect() {
  redirect('/contact?program=barber-apprenticeship');
}
