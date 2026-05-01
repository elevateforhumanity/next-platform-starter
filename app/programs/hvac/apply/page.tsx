import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Canonical apply flow is at /programs/hvac-technician/apply
// This stub preserves inbound links to the old URL.
export default function Page() {
  redirect('/programs/hvac-technician/apply');
}
