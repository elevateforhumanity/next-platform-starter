export const dynamic = 'force-dynamic';
import { QMA } from '@/data/programs/qma';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(QMA);

export default function QMAPage() {
  return <ProgramMarketingPage program={QMA} />;
}
