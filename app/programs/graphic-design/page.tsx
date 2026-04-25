import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { GRAPHIC_DESIGN } from '@/data/programs/graphic-design';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: GRAPHIC_DESIGN.metaTitle ?? `${GRAPHIC_DESIGN.title} | Elevate for Humanity`,
  description: GRAPHIC_DESIGN.metaDescription ?? GRAPHIC_DESIGN.subtitle,
  alternates: { canonical: '/programs/graphic-design' },
};

export default function Page() {
  const banner = heroBanners['graphic-design'] ?? null;
  return <ProgramDetailPage program={GRAPHIC_DESIGN} banner={banner} />;
}
