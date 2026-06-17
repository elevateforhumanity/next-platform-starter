import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Building Services Technician Program Waitlist",
  description: "Join the waitlist for our Building Services Technician certification program.",
  robots: { index: false, follow: false },
};

/** Building Services enrollment opens soon — redirect to apply when ready */
export default function BuildingServicesWaitlistRedirectPage() {
  redirect('/apply?program=building-services-technician');
}
