export const dynamic = 'force-dynamic';
import { importName } from '@/data/programs/plumbing';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(PLUMBING);

export default function ProgramPage() {
  return <ProgramMarketingPage program={PLUMBING} />;
}
