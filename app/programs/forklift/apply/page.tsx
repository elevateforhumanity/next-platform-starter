import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { FORKLIFT } from '@/data/programs/forklift';

export const metadata: Metadata = {
  title: `Apply — ${FORKLIFT.title} | Elevate for Humanity`,
  description: `Apply for the ${FORKLIFT.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={FORKLIFT} />;
}
