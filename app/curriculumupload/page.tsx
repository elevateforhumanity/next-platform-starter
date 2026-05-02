// Canonical curriculum upload is at /admin/curriculum/upload.
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  permanentRedirect('/admin/curriculum/upload');
}
