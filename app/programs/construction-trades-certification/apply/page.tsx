import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CONSTRUCTION_TRADES } from '@/data/programs/construction-trades-certification';

export const metadata: Metadata = {
  title: `Apply — ${CONSTRUCTION_TRADES.title} | Elevate for Humanity`,
  description: `Apply for the ${CONSTRUCTION_TRADES.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CONSTRUCTION_TRADES} />;
}
