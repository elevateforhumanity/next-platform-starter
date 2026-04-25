import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CAD_DRAFTING } from '@/data/programs/cad-drafting';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CAD_DRAFTING.metaTitle ?? `${CAD_DRAFTING.title} | Elevate for Humanity`,
  description: CAD_DRAFTING.metaDescription ?? CAD_DRAFTING.subtitle,
  alternates: { canonical: '/programs/cad-drafting' },
};

export default function Page() {
  const banner = heroBanners['cad-drafting'] ?? null;
  return <ProgramDetailPage program={CAD_DRAFTING} banner={banner} />;
}
