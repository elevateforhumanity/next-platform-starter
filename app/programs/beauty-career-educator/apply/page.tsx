import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { BEAUTY_CAREER_EDUCATOR } from '@/data/programs/beauty-career-educator';

export const metadata: Metadata = {
  title: `Apply — ${BEAUTY_CAREER_EDUCATOR.title} | Elevate for Humanity`,
  description: `Apply for the ${BEAUTY_CAREER_EDUCATOR.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={BEAUTY_CAREER_EDUCATOR} />;
}
