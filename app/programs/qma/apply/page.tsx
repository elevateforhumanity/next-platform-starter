import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { QMA } from '@/data/programs/qma';

export const metadata: Metadata = {
  title: `Apply — ${QMA.title} | Elevate for Humanity`,
  description: `Apply for the ${QMA.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={QMA} />;
}
