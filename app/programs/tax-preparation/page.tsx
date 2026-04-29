import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { TAX_PREPARATION } from '@/data/programs/tax-preparation';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: TAX_PREPARATION.metaTitle ?? `${TAX_PREPARATION.title} | Elevate for Humanity`,
  description: TAX_PREPARATION.metaDescription ?? TAX_PREPARATION.subtitle,
  alternates: { canonical: '/programs/tax-preparation' },
  openGraph: {
    title: 'Tax Preparation | Elevate for Humanity',
    description: 'IRS AFSP and CTEC certification. Launch your tax preparation career with Elevate.',
    url: 'https://www.elevateforhumanity.org/programs/tax-preparation',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/tax-main-hero.jpg', width: 1200, height: 630, alt: 'Tax Preparation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tax Preparation | Elevate for Humanity',
    description: 'IRS AFSP and CTEC certification. Launch your tax preparation career with Elevate.',
    images: ['https://www.elevateforhumanity.org/images/pages/tax-main-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['tax-preparation'] ?? null;
  return <ProgramDetailPage program={TAX_PREPARATION} banner={banner} />;
}
