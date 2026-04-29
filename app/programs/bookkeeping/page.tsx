import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BOOKKEEPING } from '@/data/programs/bookkeeping';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: BOOKKEEPING.metaTitle ?? `${BOOKKEEPING.title} | Elevate for Humanity`,
  description: BOOKKEEPING.metaDescription ?? BOOKKEEPING.subtitle,
  alternates: { canonical: '/programs/bookkeeping' },
  openGraph: {
    title: 'Bookkeeping & Accounting | Elevate for Humanity',
    description: 'QuickBooks and bookkeeping certification. WIOA funded. Launch your accounting career.',
    url: 'https://www.elevateforhumanity.org/programs/bookkeeping',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/programs/efh-business-startup-marketing-hero.jpg', width: 1200, height: 630, alt: 'Bookkeeping & Accounting' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookkeeping & Accounting | Elevate for Humanity',
    description: 'QuickBooks and bookkeeping certification. WIOA funded. Launch your accounting career.',
    images: ['https://www.elevateforhumanity.org/images/programs/efh-business-startup-marketing-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['bookkeeping'] ?? null;
  return <ProgramDetailPage program={BOOKKEEPING} banner={banner} />;
}
