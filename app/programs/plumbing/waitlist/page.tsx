import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Plumbing Program Waitlist",
  description: "Join the waitlist for our Plumbing certification program.",
  robots: { index: false, follow: false },
};

/** Plumbing enrollment opens soon — redirect to apply when ready */
export default function PlumbingWaitlistRedirectPage() {
  redirect('/apply?program=plumbing');
}
