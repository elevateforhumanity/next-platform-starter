import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NETWORK_ADMIN } from '@/data/programs/network-administration';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NETWORK_ADMIN.metaTitle ?? `${NETWORK_ADMIN.title} | Elevate for Humanity`,
  description: NETWORK_ADMIN.metaDescription ?? NETWORK_ADMIN.subtitle,
  alternates: { canonical: '/programs/network-administration' },
  openGraph: {
    title: 'Network Administration | Elevate for Humanity',
    description: 'CompTIA Network+ and CCNA certification. WIOA funded. High-demand IT career.',
    url: 'https://www.elevateforhumanity.org/programs/network-administration',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/networking-hero.jpg', width: 1200, height: 630, alt: 'Network Administration' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Network Administration | Elevate for Humanity',
    description: 'CompTIA Network+ and CCNA certification. WIOA funded. High-demand IT career.',
    images: ['https://www.elevateforhumanity.org/images/pages/networking-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['network-administration'] ?? null;
  return <ProgramDetailPage program={NETWORK_ADMIN} banner={banner} />;
}
