import { redirect } from 'next/navigation';

/** CDL enrollment is open — legacy waitlist URL sends applicants to apply. */
export default function CDLWaitlistRedirectPage() {
  redirect('/apply?program=cdl-training');
}
