import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { SOFTWARE_DEV } from '@/data/programs/software-development';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: SOFTWARE_DEV.metaTitle ?? `${SOFTWARE_DEV.title} | Elevate for Humanity`,
  description: SOFTWARE_DEV.metaDescription ?? SOFTWARE_DEV.subtitle,
  alternates: { canonical: '/programs/software-development' },
  openGraph: {
    title: 'Software Development | Elevate for Humanity',
    description: 'Full-stack software development training. WIOA funded. Launch your tech career.',
    url: 'https://www.elevateforhumanity.org/programs/software-development',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/networking-hero.jpg', width: 1200, height: 630, alt: 'Software Development' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software Development | Elevate for Humanity',
    description: 'Full-stack software development training. WIOA funded. Launch your tech career.',
    images: ['https://www.elevateforhumanity.org/images/pages/networking-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['software-development'] ?? null;
  return <ProgramDetailPage program={SOFTWARE_DEV} banner={banner} />;
}
