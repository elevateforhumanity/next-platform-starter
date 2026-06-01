import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Mission Control | Admin',
};

/** Mission Control merged into /admin/dashboard — one operational home. */
export default function MissionControlRedirectPage() {
  redirect('/admin/dashboard');
}
