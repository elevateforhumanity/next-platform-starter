import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { BUSINESS_ADMIN } from '@/data/programs/business-administration';

export const metadata: Metadata = {
  title: `Apply — ${BUSINESS_ADMIN.title} | Elevate for Humanity`,
  description: `Apply for the ${BUSINESS_ADMIN.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={BUSINESS_ADMIN} />;
}
