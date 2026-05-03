import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { PHLEBOTOMY } from '@/data/programs/phlebotomy';

export const metadata: Metadata = {
  title: `Apply — ${PHLEBOTOMY.title} | Elevate for Humanity`,
  description: `Apply for the ${PHLEBOTOMY.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={PHLEBOTOMY} />;
}
