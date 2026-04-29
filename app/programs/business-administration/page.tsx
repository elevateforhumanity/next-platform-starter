import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BUSINESS_ADMIN } from '@/data/programs/business-administration';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: BUSINESS_ADMIN.metaTitle ?? `${BUSINESS_ADMIN.title} | Elevate for Humanity`,
  description: BUSINESS_ADMIN.metaDescription ?? BUSINESS_ADMIN.subtitle,
  alternates: { canonical: '/programs/business-administration' },
  openGraph: {
    title: 'Business Administration | Elevate for Humanity',
    description: 'Business administration training and certification. WIOA funded.',
    url: 'https://www.elevateforhumanity.org/programs/business-administration',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/programs/efh-business-startup-marketing-hero.jpg', width: 1200, height: 630, alt: 'Business Administration' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Administration | Elevate for Humanity',
    description: 'Business administration training and certification. WIOA funded.',
    images: ['https://www.elevateforhumanity.org/images/programs/efh-business-startup-marketing-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['business-administration'] ?? null;
  return <ProgramDetailPage program={BUSINESS_ADMIN} banner={banner} />;
}
