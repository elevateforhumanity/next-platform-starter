import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { PROJECT_MANAGEMENT } from '@/data/programs/project-management';

export const metadata: Metadata = {
  title: `Apply — ${PROJECT_MANAGEMENT.title} | Elevate for Humanity`,
  description: `Apply for the ${PROJECT_MANAGEMENT.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={PROJECT_MANAGEMENT} />;
}
