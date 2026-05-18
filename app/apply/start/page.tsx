import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  robots: { index: false, follow: false },
};

// Superseded by /apply (top-of-funnel screener) → /apply/student (full enrollment form).
export default function ApplyStartPage() {
  permanentRedirect('/apply');
}
