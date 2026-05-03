import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { SANITATION } from '@/data/programs/sanitation-infection-control';

export const metadata: Metadata = {
  title: `Apply — ${SANITATION.title} | Elevate for Humanity`,
  description: `Apply for the ${SANITATION.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={SANITATION} />;
}
