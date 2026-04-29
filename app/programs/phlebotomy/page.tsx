import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PHLEBOTOMY } from '@/data/programs/phlebotomy';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PHLEBOTOMY.metaTitle ?? `${PHLEBOTOMY.title} | Elevate for Humanity`,
  description: PHLEBOTOMY.metaDescription ?? PHLEBOTOMY.subtitle,
  alternates: { canonical: '/programs/phlebotomy' },
  openGraph: {
    title: 'Phlebotomy Technician | Elevate for Humanity',
    description: 'NHA CPT certification. No Indiana state license required. FSSA and WIOA funding available.',
    url: 'https://www.elevateforhumanity.org/programs/phlebotomy',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-medical-apply-hero.jpg', width: 1200, height: 630, alt: 'Phlebotomy Technician' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phlebotomy Technician | Elevate for Humanity',
    description: 'NHA CPT certification. No Indiana state license required. FSSA and WIOA funding available.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-medical-apply-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['phlebotomy'] ?? null;
  return <ProgramDetailPage program={PHLEBOTOMY} banner={banner} />;
}
