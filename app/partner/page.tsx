import { permanentRedirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Partner',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partner',
  },
  robots: {
    index: false,
    follow: false,
  },
};
export default function PartnerPage() {
  permanentRedirect('/partner/dashboard');
}
