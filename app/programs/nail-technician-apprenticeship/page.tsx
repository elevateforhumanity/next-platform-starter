import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NAIL_TECH.metaTitle ?? `${NAIL_TECH.title} | Elevate for Humanity`,
  description: NAIL_TECH.metaDescription ?? NAIL_TECH.subtitle,
  alternates: { canonical: '/programs/nail-technician-apprenticeship' },
};

export default function Page() {
  const banner = heroBanners['nail-technician-apprenticeship'] ?? null;
  return <ProgramDetailPage program={NAIL_TECH} banner={banner} />;
}
