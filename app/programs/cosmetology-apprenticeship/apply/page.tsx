import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';

export const metadata: Metadata = {
  title: `Apply — ${COSMETOLOGY.title} | Elevate for Humanity`,
  description: `Apply for the ${COSMETOLOGY.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={COSMETOLOGY} />;
}
