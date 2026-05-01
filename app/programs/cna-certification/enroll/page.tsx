import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Canonical enroll flow is at /programs/cna/enroll (has auth guard + correct program slug)
export default function Page() {
  redirect('/programs/cna/enroll');
}
