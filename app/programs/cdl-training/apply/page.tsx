import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CDL_TRAINING } from '@/data/programs/cdl-training';

export const metadata: Metadata = {
  title: `Apply — ${CDL_TRAINING.title} | Elevate for Humanity`,
  description: `Apply for the ${CDL_TRAINING.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CDL_TRAINING} />;
}
