import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { MEDICAL_ASSISTANT } from '@/data/programs/medical-assistant';

export const metadata: Metadata = {
  title: `Apply — ${MEDICAL_ASSISTANT.title} | Elevate for Humanity`,
  description: `Apply for the ${MEDICAL_ASSISTANT.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={MEDICAL_ASSISTANT} />;
}
