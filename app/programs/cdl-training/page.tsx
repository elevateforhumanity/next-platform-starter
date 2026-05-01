import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CDL_TRAINING } from '@/data/programs/cdl-training';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CDL_TRAINING.metaTitle ?? `${CDL_TRAINING.title} | Elevate for Humanity`,
  description: CDL_TRAINING.metaDescription ?? CDL_TRAINING.subtitle,
  alternates: { canonical: '/programs/cdl-training' },
  openGraph: {
    title: 'CDL Training Program (Class A & Class B) | Elevate for Humanity',
    description: 'Get your CDL Class A or Class B license in 1–6 weeks. Job placement support. WIOA funding available.',
    url: 'https://www.elevateforhumanity.org/programs/cdl-training',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-cdl-hero.jpg', width: 1200, height: 630, alt: 'CDL Training Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CDL Training Program (Class A & Class B) | Elevate for Humanity',
    description: 'Get your CDL Class A or Class B license in 1–6 weeks. Job placement support. WIOA funding available.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-cdl-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['cdl-training'] ?? null;
  return <ProgramDetailPage program={CDL_TRAINING} banner={banner} />;
}
