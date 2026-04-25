import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { FORKLIFT } from '@/data/programs/forklift';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: FORKLIFT.metaTitle ?? `${FORKLIFT.title} | Elevate for Humanity`,
  description: FORKLIFT.metaDescription ?? FORKLIFT.subtitle,
  alternates: { canonical: '/programs/forklift' },
};

export default function Page() {
  const banner = heroBanners['forklift'] ?? null;
  return <ProgramDetailPage program={FORKLIFT} banner={banner} />;
}
