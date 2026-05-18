import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false }, robots: { index: false, follow: false } };

// Legacy FSSA success path retained as a redirect.
export default function LegacyFssaApplySuccessRedirect() {
  permanentRedirect('/apply');
}
