import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { WEB_DEVELOPMENT } from '@/data/programs/web-development';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: WEB_DEVELOPMENT.metaTitle ?? `${WEB_DEVELOPMENT.title} | Elevate for Humanity`,
  description: WEB_DEVELOPMENT.metaDescription ?? WEB_DEVELOPMENT.subtitle,
  alternates: { canonical: '/programs/web-development' },
  openGraph: {
    title: 'Web Development | Elevate for Humanity',
    description: 'Full-stack web development training. WIOA funded. Launch your tech career.',
    url: 'https://www.elevateforhumanity.org/programs/web-development',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/networking-hero.jpg', width: 1200, height: 630, alt: 'Web Development' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Development | Elevate for Humanity',
    description: 'Full-stack web development training. WIOA funded. Launch your tech career.',
    images: ['https://www.elevateforhumanity.org/images/pages/networking-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['web-development'] ?? null;
  return <ProgramDetailPage program={WEB_DEVELOPMENT} banner={banner} />;
}
