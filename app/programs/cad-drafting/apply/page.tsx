import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { CAD_DRAFTING } from '@/data/programs/cad-drafting';

export const metadata: Metadata = {
  title: `Apply — ${CAD_DRAFTING.title} | Elevate for Humanity`,
  description: `Apply for the ${CAD_DRAFTING.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={CAD_DRAFTING} />;
}
