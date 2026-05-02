// /certificates/verify is not the canonical verification page.
// Real certificate verification is at /cert/verify/[certificateId].
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  permanentRedirect('/cert/verify');
}
