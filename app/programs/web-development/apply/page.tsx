import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { WEB_DEVELOPMENT } from '@/data/programs/web-development';

export const metadata: Metadata = {
  title: `Apply — ${WEB_DEVELOPMENT.title} | Elevate for Humanity`,
  description: `Apply for the ${WEB_DEVELOPMENT.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={WEB_DEVELOPMENT} />;
}
