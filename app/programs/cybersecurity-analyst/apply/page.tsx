import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CYBERSECURITY_ANALYST } from '@/data/programs/cybersecurity-analyst';

export const metadata: Metadata = {
  title: `Apply — ${CYBERSECURITY_ANALYST.title} | Elevate for Humanity`,
  description: `Apply for the ${CYBERSECURITY_ANALYST.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CYBERSECURITY_ANALYST} />;
}
