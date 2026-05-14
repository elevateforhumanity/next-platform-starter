import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Legacy FSSA path retained as a redirect to SNAP.
export default function LegacyFssaPartnershipRequestRedirect() {
  permanentRedirect('/snap/snap-et');
}
