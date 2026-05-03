import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { PHARMACY_TECHNICIAN } from '@/data/programs/pharmacy-technician';

export const metadata: Metadata = {
  title: `Apply — ${PHARMACY_TECHNICIAN.title} | Elevate for Humanity`,
  description: `Apply for the ${PHARMACY_TECHNICIAN.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={PHARMACY_TECHNICIAN} />;
}
