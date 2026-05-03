import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { HOME_HEALTH_AIDE } from '@/data/programs/home-health-aide';

export const metadata: Metadata = {
  title: `Apply — ${HOME_HEALTH_AIDE.title} | Elevate for Humanity`,
  description: `Apply for the ${HOME_HEALTH_AIDE.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={HOME_HEALTH_AIDE} />;
}
