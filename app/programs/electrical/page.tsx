import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ELECTRICAL } from '@/data/programs/electrical';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ELECTRICAL.metaTitle ?? `${ELECTRICAL.title} | Elevate for Humanity`,
  description: ELECTRICAL.metaDescription ?? ELECTRICAL.subtitle,
  alternates: { canonical: '/programs/electrical' },
  openGraph: {
    title: 'Electrical Training | Elevate for Humanity',
    description: 'Electrical apprenticeship and certification training. WIOA funded. High-demand skilled trade.',
    url: 'https://www.elevateforhumanity.org/programs/electrical',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-electrical-apply-hero.jpg', width: 1200, height: 630, alt: 'Electrical Training' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Electrical Training | Elevate for Humanity',
    description: 'Electrical apprenticeship and certification training. WIOA funded. High-demand skilled trade.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-electrical-apply-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['electrical'] ?? null;
  return <ProgramDetailPage program={ELECTRICAL} banner={banner} />;
}
