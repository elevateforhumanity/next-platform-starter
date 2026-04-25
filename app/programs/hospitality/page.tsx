import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { HOSPITALITY } from '@/data/programs/hospitality';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: HOSPITALITY.metaTitle ?? `${HOSPITALITY.title} | Elevate for Humanity`,
  description: HOSPITALITY.metaDescription ?? HOSPITALITY.subtitle,
  alternates: { canonical: '/programs/hospitality' },
};

export default function Page() {
  const banner = heroBanners['hospitality'] ?? null;
  return <ProgramDetailPage program={HOSPITALITY} banner={banner} />;
}
