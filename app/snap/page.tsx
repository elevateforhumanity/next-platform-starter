import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SNAP E&T | Elevate for Humanity',
  description: 'SNAP Employment & Training information and partnership details.',
  robots: { index: false, follow: false },
};

export default function SnapRootPage() {
  permanentRedirect('/snap/snap-et');
}
