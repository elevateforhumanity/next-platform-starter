import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CNA } from '@/data/programs/cna';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CNA.metaTitle ?? `${CNA.title} | Elevate for Humanity`,
  description: CNA.metaDescription ?? CNA.subtitle,
  alternates: { canonical: '/programs/cna' },
  openGraph: {
    title: 'Certified Nursing Assistant (CNA) | Elevate for Humanity',
    description: 'Indiana CNA certification training. FSSA SNAP E&T funded. Start your healthcare career in weeks.',
    url: 'https://www.elevateforhumanity.org/programs/cna',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-cna-hero.jpg', width: 1200, height: 630, alt: 'Certified Nursing Assistant (CNA)' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certified Nursing Assistant (CNA) | Elevate for Humanity',
    description: 'Indiana CNA certification training. FSSA SNAP E&T funded. Start your healthcare career in weeks.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-cna-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['cna'] ?? null;
  return <ProgramDetailPage program={CNA} banner={banner} />;
}
