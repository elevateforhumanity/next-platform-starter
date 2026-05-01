import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Canonical enrollment success is at /programs/esthetician/enrollment-success
export default function Page() {
  redirect('/programs/esthetician/enrollment-success');
}
