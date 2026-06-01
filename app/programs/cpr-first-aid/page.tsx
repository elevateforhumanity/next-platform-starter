export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';
import heroBanners from '@/content/heroBanners';

export const metadata: Metadata = {
  title: CPR_FIRST_AID.metaTitle,
  description: CPR_FIRST_AID.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cpr-first-aid' },
};

export default function CprFirstAidPage() {
  const banner = heroBanners['cpr-first-aid'] ?? null;
  return <ProgramDetailPage program={CPR_FIRST_AID} banner={banner} />;
}
