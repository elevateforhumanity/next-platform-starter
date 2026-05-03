import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';

export const metadata: Metadata = {
  title: `Apply — ${CPR_FIRST_AID.title} | Elevate for Humanity`,
  description: `Apply for the ${CPR_FIRST_AID.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CPR_FIRST_AID} />;
}
