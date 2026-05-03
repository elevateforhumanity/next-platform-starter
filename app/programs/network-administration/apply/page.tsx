import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { NETWORK_ADMIN } from '@/data/programs/network-administration';

export const metadata: Metadata = {
  title: `Apply — ${NETWORK_ADMIN.title} | Elevate for Humanity`,
  description: `Apply for the ${NETWORK_ADMIN.title} program at Elevate for Humanity.`,
  robots: { index: false },
};

export default function ApplyPage() {
  return <ProgramApplyPage program={NETWORK_ADMIN} />;
}
