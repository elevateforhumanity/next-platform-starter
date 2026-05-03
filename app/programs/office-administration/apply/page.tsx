import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { OFFICE_ADMINISTRATION } from '@/data/programs/office-administration';

export const metadata: Metadata = {
  title: `Apply — ${OFFICE_ADMINISTRATION.title} | Elevate for Humanity`,
  description: `Apply for the ${OFFICE_ADMINISTRATION.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={OFFICE_ADMINISTRATION} />;
}
