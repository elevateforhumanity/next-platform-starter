import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CULINARY } from '@/data/programs/culinary-apprenticeship';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CULINARY.metaTitle ?? `${CULINARY.title} | Elevate for Humanity`,
  description: CULINARY.metaDescription ?? CULINARY.subtitle,
  alternates: { canonical: '/programs/culinary-apprenticeship' },
};

export default function Page() {
  const banner = heroBanners['culinary-apprenticeship'] ?? null;
  return <ProgramDetailPage program={CULINARY} banner={banner} />;
}
