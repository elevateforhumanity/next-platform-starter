import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NAIL_TECH.metaTitle ?? `${NAIL_TECH.title} | Elevate for Humanity`,
  description: NAIL_TECH.metaDescription ?? NAIL_TECH.subtitle,
  alternates: { canonical: '/programs/nail-technician-apprenticeship' },
  openGraph: {
    title: 'Nail Technician Apprenticeship | Elevate for Humanity',
    description: 'DOL Registered Nail Technician Apprenticeship. Indiana Nail Technician License. FSSA funded.',
    url: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/nail-tech-hero.jpg', width: 1200, height: 630, alt: 'Nail Technician Apprenticeship' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nail Technician Apprenticeship | Elevate for Humanity',
    description: 'DOL Registered Nail Technician Apprenticeship. Indiana Nail Technician License. FSSA funded.',
    images: ['https://www.elevateforhumanity.org/images/pages/nail-tech-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['nail-technician-apprenticeship'] ?? null;
  return <ProgramDetailPage program={NAIL_TECH} banner={banner} />;
}
