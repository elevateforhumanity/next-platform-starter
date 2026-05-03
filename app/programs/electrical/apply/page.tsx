import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { ELECTRICAL } from '@/data/programs/electrical';

export const metadata: Metadata = {
  title: `Apply — ${ELECTRICAL.title} | Elevate for Humanity`,
  description: `Apply for the ${ELECTRICAL.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={ELECTRICAL} />;
}
