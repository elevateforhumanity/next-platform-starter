import { permanentRedirect } from 'next/navigation';

// No dedicated CNA apply page — send to generic intake.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export default function CnaApplyPage() {
  permanentRedirect('/apply?program=cna');
}
