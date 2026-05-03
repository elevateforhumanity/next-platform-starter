import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { BOOKKEEPING } from '@/data/programs/bookkeeping';

export const metadata: Metadata = {
  title: `Apply — ${BOOKKEEPING.title} | Elevate for Humanity`,
  description: `Apply for the ${BOOKKEEPING.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={BOOKKEEPING} />;
}
