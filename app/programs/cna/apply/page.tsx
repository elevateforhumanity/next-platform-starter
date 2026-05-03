import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CNA } from '@/data/programs/cna';

export const metadata: Metadata = {
  title: `Apply — ${CNA.title} | Elevate for Humanity`,
  description: `Apply for the ${CNA.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CNA} />;
}
