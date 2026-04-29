import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ESTHETICIAN } from '@/data/programs/esthetician';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ESTHETICIAN.metaTitle ?? `${ESTHETICIAN.title} | Elevate for Humanity`,
  description: ESTHETICIAN.metaDescription ?? ESTHETICIAN.subtitle,
  alternates: { canonical: '/programs/esthetician' },
  openGraph: {
    title: 'Esthetician Training | Elevate for Humanity',
    description: 'Indiana Esthetician License training. FSSA and WIOA funding available.',
    url: 'https://www.elevateforhumanity.org/programs/esthetician',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/programs/efh-esthetician-client-services-card.jpg', width: 1200, height: 630, alt: 'Esthetician Training' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Esthetician Training | Elevate for Humanity',
    description: 'Indiana Esthetician License training. FSSA and WIOA funding available.',
    images: ['https://www.elevateforhumanity.org/images/programs/efh-esthetician-client-services-card.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['esthetician'] ?? null;
  return <ProgramDetailPage program={ESTHETICIAN} banner={banner} />;
}
