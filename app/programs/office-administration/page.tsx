import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { OFFICE_ADMINISTRATION } from '@/data/programs/office-administration';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: OFFICE_ADMINISTRATION.metaTitle ?? `${OFFICE_ADMINISTRATION.title} | Elevate for Humanity`,
  description: OFFICE_ADMINISTRATION.metaDescription ?? OFFICE_ADMINISTRATION.subtitle,
  alternates: { canonical: '/programs/office-administration' },
};

export default function Page() {
  const banner = heroBanners['office-administration'] ?? null;
  return <ProgramDetailPage program={OFFICE_ADMINISTRATION} banner={banner} />;
}
