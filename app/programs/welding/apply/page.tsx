import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { WELDING } from '@/data/programs/welding';

export const metadata: Metadata = {
  title: `Apply — ${WELDING.title} | Elevate for Humanity`,
  description: `Apply for the ${WELDING.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={WELDING} />;
}
