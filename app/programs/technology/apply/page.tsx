import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { TECHNOLOGY } from '@/data/programs/technology';

export const metadata: Metadata = {
  title: `Apply — ${TECHNOLOGY.title} | Elevate for Humanity`,
  description: `Apply for the ${TECHNOLOGY.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={TECHNOLOGY} />;
}
