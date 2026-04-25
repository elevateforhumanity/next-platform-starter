import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ESTHETICIAN } from '@/data/programs/esthetician';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ESTHETICIAN.metaTitle ?? `${ESTHETICIAN.title} | Elevate for Humanity`,
  description: ESTHETICIAN.metaDescription ?? ESTHETICIAN.subtitle,
  alternates: { canonical: '/programs/esthetician' },
};

export default function Page() {
  const banner = heroBanners['esthetician'] ?? null;
  return <ProgramDetailPage program={ESTHETICIAN} banner={banner} />;
}
