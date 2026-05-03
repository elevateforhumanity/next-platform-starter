import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CULINARY } from '@/data/programs/culinary-apprenticeship';

export const metadata: Metadata = {
  title: `Apply — ${CULINARY.title} | Elevate for Humanity`,
  description: `Apply for the ${CULINARY.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CULINARY} />;
}
