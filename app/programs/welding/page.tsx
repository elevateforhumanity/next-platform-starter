export const dynamic = 'force-dynamic';
import { WELDING } from '@/data/programs/welding';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(WELDING);

export default function WeldingPage() {
  return <ProgramMarketingPage program={WELDING} />;
}
