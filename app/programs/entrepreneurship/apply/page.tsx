import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { ENTREPRENEURSHIP } from '@/data/programs/entrepreneurship';

export const metadata: Metadata = {
  title: `Apply — ${ENTREPRENEURSHIP.title} | Elevate for Humanity`,
  description: `Apply for the ${ENTREPRENEURSHIP.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={ENTREPRENEURSHIP} />;
}
