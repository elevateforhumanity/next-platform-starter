import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CYBERSECURITY_ANALYST } from '@/data/programs/cybersecurity-analyst';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CYBERSECURITY_ANALYST.metaTitle ?? `${CYBERSECURITY_ANALYST.title} | Elevate for Humanity`,
  description: CYBERSECURITY_ANALYST.metaDescription ?? CYBERSECURITY_ANALYST.subtitle,
  alternates: { canonical: '/programs/cybersecurity-analyst' },
  openGraph: {
    title: 'Cybersecurity Analyst | Elevate for Humanity',
    description: 'Launch a cybersecurity career. CompTIA Security+ and CySA+ certification prep. WIOA and FSSA funding available.',
    url: 'https://www.elevateforhumanity.org/programs/cybersecurity-analyst',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/cybersecurity-hero.jpg', width: 1200, height: 630, alt: 'Cybersecurity Analyst' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cybersecurity Analyst | Elevate for Humanity',
    description: 'Launch a cybersecurity career. CompTIA Security+ and CySA+ certification prep. WIOA and FSSA funding available.',
    images: ['https://www.elevateforhumanity.org/images/pages/cybersecurity-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['cybersecurity-analyst'] ?? null;
  return <ProgramDetailPage program={CYBERSECURITY_ANALYST} banner={banner} />;
}
