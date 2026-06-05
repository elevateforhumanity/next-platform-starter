export const dynamic = 'force-dynamic';
import { CDL_TRAINING } from '@/data/programs/cdl-training';
import CdlEnrollmentOpenBanner from '@/components/programs/CdlEnrollmentOpenBanner';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(CDL_TRAINING);

export default function CDLTrainingPage() {
  return (
    <ProgramMarketingPage program={CDL_TRAINING} announcement={<CdlEnrollmentOpenBanner />} />
  );
}
