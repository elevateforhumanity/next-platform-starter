import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { DIESEL_MECHANIC } from '@/data/programs/diesel-mechanic';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: DIESEL_MECHANIC.metaTitle ?? `${DIESEL_MECHANIC.title} | Elevate for Humanity`,
  description: DIESEL_MECHANIC.metaDescription ?? DIESEL_MECHANIC.subtitle,
  alternates: { canonical: '/programs/diesel-mechanic' },
};

export default function Page() {
  const banner = heroBanners['diesel-mechanic'] ?? null;
  return <ProgramDetailPage program={DIESEL_MECHANIC} banner={banner} />;
}
