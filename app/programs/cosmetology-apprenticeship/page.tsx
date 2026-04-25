import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: COSMETOLOGY.metaTitle ?? `${COSMETOLOGY.title} | Elevate for Humanity`,
  description: COSMETOLOGY.metaDescription ?? COSMETOLOGY.subtitle,
  alternates: { canonical: '/programs/cosmetology-apprenticeship' },
};

export default function Page() {
  const banner = heroBanners['cosmetology-apprenticeship'] ?? null;
  return <ProgramDetailPage program={COSMETOLOGY} banner={banner} />;
}
