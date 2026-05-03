import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { EMERGENCY_HEALTH_SAFETY } from '@/data/programs/emergency-health-safety';

export const metadata: Metadata = {
  title: `Apply — ${EMERGENCY_HEALTH_SAFETY.title} | Elevate for Humanity`,
  description: `Apply for the ${EMERGENCY_HEALTH_SAFETY.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={EMERGENCY_HEALTH_SAFETY} />;
}
