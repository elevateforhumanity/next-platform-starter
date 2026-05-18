import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  robots: { index: false, follow: false },
};

// Superseded by /apply/student (full enrollment form with eligibility engine).
export default function FullApplicationPage() {
  permanentRedirect('/apply/student');
}
