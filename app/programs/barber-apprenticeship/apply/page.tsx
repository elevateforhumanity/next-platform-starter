import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';

export const metadata: Metadata = {
  title: `Apply — ${BARBER_APPRENTICESHIP.title} | Elevate for Humanity`,
  description: `Apply for the ${BARBER_APPRENTICESHIP.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={BARBER_APPRENTICESHIP} />;
}
