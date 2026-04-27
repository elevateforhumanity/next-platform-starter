import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CNA } from '@/data/programs/cna';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CNA.metaTitle ?? `${CNA.title} | Elevate for Humanity`,
  description: CNA.metaDescription ?? CNA.subtitle,
  alternates: { canonical: '/programs/certified-nursing-assistant' },
};

export default function Page() {
  const banner = heroBanners['cna'] ?? null;
  return <ProgramDetailPage program={CNA} banner={banner} />;
}
