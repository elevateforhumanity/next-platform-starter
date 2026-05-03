import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { DIESEL_MECHANIC } from '@/data/programs/diesel-mechanic';

export const metadata: Metadata = {
  title: `Apply — ${DIESEL_MECHANIC.title} | Elevate for Humanity`,
  description: `Apply for the ${DIESEL_MECHANIC.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={DIESEL_MECHANIC} />;
}
