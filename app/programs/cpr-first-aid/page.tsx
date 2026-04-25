import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CPR_FIRST_AID.metaTitle ?? `${CPR_FIRST_AID.title} | Elevate for Humanity`,
  description: CPR_FIRST_AID.metaDescription ?? CPR_FIRST_AID.subtitle,
  alternates: { canonical: '/programs/cpr-first-aid' },
};

export default function Page() {
  const banner = heroBanners['cpr-first-aid'] ?? null;
  return <ProgramDetailPage program={CPR_FIRST_AID} banner={banner} />;
}
