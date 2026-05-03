import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { IT_HELP_DESK } from '@/data/programs/it-help-desk';

export const metadata: Metadata = {
  title: `Apply — ${IT_HELP_DESK.title} | Elevate for Humanity`,
  description: `Apply for the ${IT_HELP_DESK.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={IT_HELP_DESK} />;
}
