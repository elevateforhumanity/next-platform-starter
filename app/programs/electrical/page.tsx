import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ELECTRICAL } from '@/data/programs/electrical';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ELECTRICAL.metaTitle ?? `${ELECTRICAL.title} | Elevate for Humanity`,
  description: ELECTRICAL.metaDescription ?? ELECTRICAL.subtitle,
  alternates: { canonical: '/programs/electrical' },
};

export default function Page() {
  const banner = heroBanners['electrical'] ?? null;
  return <ProgramDetailPage program={ELECTRICAL} banner={banner} />;
}
