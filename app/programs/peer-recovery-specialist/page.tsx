import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PEER_RECOVERY } from '@/data/programs/peer-recovery-specialist';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PEER_RECOVERY.metaTitle ?? `${PEER_RECOVERY.title} | Elevate for Humanity`,
  description: PEER_RECOVERY.metaDescription ?? PEER_RECOVERY.subtitle,
  alternates: { canonical: '/programs/peer-recovery-specialist' },
};

export default function Page() {
  return <ProgramDetailPage program={PEER_RECOVERY} />;
}
