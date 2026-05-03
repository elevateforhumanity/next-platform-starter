import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { NETWORK_SUPPORT } from '@/data/programs/network-support-technician';

export const metadata: Metadata = {
  title: `Apply — ${NETWORK_SUPPORT.title} | Elevate for Humanity`,
  description: `Apply for the ${NETWORK_SUPPORT.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={NETWORK_SUPPORT} />;
}
