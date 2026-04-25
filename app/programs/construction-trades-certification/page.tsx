import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CONSTRUCTION_TRADES } from '@/data/programs/construction-trades-certification';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CONSTRUCTION_TRADES.metaTitle ?? `${CONSTRUCTION_TRADES.title} | Elevate for Humanity`,
  description: CONSTRUCTION_TRADES.metaDescription ?? CONSTRUCTION_TRADES.subtitle,
  alternates: { canonical: '/programs/construction-trades-certification' },
};

export default function Page() {
  const banner = heroBanners['construction-trades-certification'] ?? null;
  return <ProgramDetailPage program={CONSTRUCTION_TRADES} banner={banner} />;
}
