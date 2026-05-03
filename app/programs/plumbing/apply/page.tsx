import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { PLUMBING } from '@/data/programs/plumbing';

export const metadata: Metadata = {
  title: `Apply — ${PLUMBING.title} | Elevate for Humanity`,
  description: `Apply for the ${PLUMBING.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={PLUMBING} />;
}
