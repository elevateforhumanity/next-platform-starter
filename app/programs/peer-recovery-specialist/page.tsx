export const dynamic = 'force-dynamic';
import { PEER_RECOVERY } from '@/data/programs/peer-recovery-specialist';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(PEER_RECOVERY);

export default function PeerRecoverySpecialistPage() {
  return <ProgramMarketingPage program={PEER_RECOVERY} />;
}
