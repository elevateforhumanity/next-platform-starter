import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { WELDING } from '@/data/programs/welding';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: WELDING.metaTitle ?? `${WELDING.title} | Elevate for Humanity`,
  description: WELDING.metaDescription ?? WELDING.subtitle,
  alternates: { canonical: '/programs/welding' },
  openGraph: {
    title: 'Welding Certification | Elevate for Humanity',
    description: 'AWS welding certification training. WIOA and FSSA funded. High-demand skilled trade in Indiana.',
    url: 'https://www.elevateforhumanity.org/programs/welding',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-welding-apply-hero.jpg', width: 1200, height: 630, alt: 'Welding Certification' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Welding Certification | Elevate for Humanity',
    description: 'AWS welding certification training. WIOA and FSSA funded. High-demand skilled trade in Indiana.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-welding-apply-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['welding'] ?? null;
  return <ProgramDetailPage program={WELDING} banner={banner} />;
}
