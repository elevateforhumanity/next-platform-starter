import { permanentRedirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export default function PoliciesSamgoveligibilityPage() {
  permanentRedirect('/legal/disclosures');
}
