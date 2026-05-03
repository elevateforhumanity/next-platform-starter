import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { TAX_PREPARATION } from '@/data/programs/tax-preparation';

export const metadata: Metadata = {
  title: `Apply — ${TAX_PREPARATION.title} | Elevate for Humanity`,
  description: `Apply for the ${TAX_PREPARATION.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={TAX_PREPARATION} />;
}
