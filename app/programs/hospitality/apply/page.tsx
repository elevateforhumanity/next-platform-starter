import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { HOSPITALITY } from '@/data/programs/hospitality';

export const metadata: Metadata = {
  title: `Apply — ${HOSPITALITY.title} | Elevate for Humanity`,
  description: `Apply for the ${HOSPITALITY.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={HOSPITALITY} />;
}
