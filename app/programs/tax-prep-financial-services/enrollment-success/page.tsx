import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Canonical enrollment success is at /programs/tax-preparation/enrollment-success
export default function Page() {
  redirect('/programs/tax-preparation/enrollment-success');
}
