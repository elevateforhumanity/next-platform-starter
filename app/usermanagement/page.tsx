// Canonical user management is at /admin/users.
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  permanentRedirect('/admin/users');
}
