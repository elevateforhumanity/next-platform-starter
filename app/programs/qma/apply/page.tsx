import { permanentRedirect } from 'next/navigation';

// No dedicated QMA apply page — send to generic intake.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export default function QmaApplyPage() {
  permanentRedirect('/apply?program=qma');
}
