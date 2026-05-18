import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false }, robots: { index: false, follow: false } };

// FSSA IMPACT program temporarily unavailable — redirects to main apply page.
// Full implementation archived in _archived/apply/fssa/
export default function FssaApplyPage() {
  permanentRedirect('/apply');
}
