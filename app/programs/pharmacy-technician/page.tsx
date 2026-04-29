import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PHARMACY_TECHNICIAN } from '@/data/programs/pharmacy-technician';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PHARMACY_TECHNICIAN.metaTitle ?? `${PHARMACY_TECHNICIAN.title} | Elevate for Humanity`,
  description: PHARMACY_TECHNICIAN.metaDescription ?? PHARMACY_TECHNICIAN.subtitle,
  alternates: { canonical: '/programs/pharmacy-technician' },
  openGraph: {
    title: 'Pharmacy Technician | Elevate for Humanity',
    description: 'PTCE certification training. WIOA and FSSA funding available. High-demand healthcare career.',
    url: 'https://www.elevateforhumanity.org/programs/pharmacy-technician',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-medical-apply-hero.jpg', width: 1200, height: 630, alt: 'Pharmacy Technician' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pharmacy Technician | Elevate for Humanity',
    description: 'PTCE certification training. WIOA and FSSA funding available. High-demand healthcare career.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-medical-apply-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['pharmacy-technician'] ?? null;
  return <ProgramDetailPage program={PHARMACY_TECHNICIAN} banner={banner} />;
}
