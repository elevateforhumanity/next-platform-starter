import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { IT_HELP_DESK } from '@/data/programs/it-help-desk';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: IT_HELP_DESK.metaTitle ?? `${IT_HELP_DESK.title} | Elevate for Humanity`,
  description: IT_HELP_DESK.metaDescription ?? IT_HELP_DESK.subtitle,
  alternates: { canonical: '/programs/it-help-desk' },
  openGraph: {
    title: 'IT Help Desk | Elevate for Humanity',
    description: 'CompTIA A+ certification. WIOA funded. Entry-level IT career pathway.',
    url: 'https://www.elevateforhumanity.org/programs/it-help-desk',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/networking-hero.jpg', width: 1200, height: 630, alt: 'IT Help Desk' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IT Help Desk | Elevate for Humanity',
    description: 'CompTIA A+ certification. WIOA funded. Entry-level IT career pathway.',
    images: ['https://www.elevateforhumanity.org/images/pages/networking-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['it-help-desk'] ?? null;
  return <ProgramDetailPage program={IT_HELP_DESK} banner={banner} />;
}
