export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ESTHETICIAN } from '@/data/programs/esthetician';
import heroBanners from '@/content/heroBanners';
import { buildProgramMetadata } from '@/lib/programs/program-page';

export const metadata: Metadata = buildProgramMetadata(ESTHETICIAN);

export default function EstheticianApprenticeshipPage() {
  const banner = heroBanners['esthetician-apprenticeship'] ?? heroBanners['esthetician'] ?? null;
  return <ProgramDetailPage program={ESTHETICIAN} banner={banner} />;
}
