import { redirect } from 'next/navigation';

export default function BarberInquiryRedirect() {
  redirect('/contact?program=barber-apprenticeship');
}
