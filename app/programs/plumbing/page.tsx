import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PLUMBING } from '@/data/programs/plumbing';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PLUMBING.metaTitle ?? `${PLUMBING.title} | Elevate for Humanity`,
  description: PLUMBING.metaDescription ?? PLUMBING.subtitle,
  alternates: { canonical: '/programs/plumbing' },
  openGraph: {
    title: 'Plumbing Training | Elevate for Humanity',
    description: 'Plumbing apprenticeship and certification training. WIOA funded. High-demand skilled trade.',
    url: 'https://www.elevateforhumanity.org/programs/plumbing',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-plumbing-apply-hero.jpg', width: 1200, height: 630, alt: 'Plumbing Training' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plumbing Training | Elevate for Humanity',
    description: 'Plumbing apprenticeship and certification training. WIOA funded. High-demand skilled trade.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-plumbing-apply-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['plumbing'] ?? null;
  return <ProgramDetailPage program={PLUMBING} banner={banner} />;
}
