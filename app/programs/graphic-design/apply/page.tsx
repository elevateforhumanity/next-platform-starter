import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { GRAPHIC_DESIGN } from '@/data/programs/graphic-design';

export const metadata: Metadata = {
  title: `Apply — ${GRAPHIC_DESIGN.title} | Elevate for Humanity`,
  description: `Apply for the ${GRAPHIC_DESIGN.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={GRAPHIC_DESIGN} />;
}
