import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NETWORK_ADMIN } from '@/data/programs/network-administration';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NETWORK_ADMIN.metaTitle ?? `${NETWORK_ADMIN.title} | Elevate for Humanity`,
  description: NETWORK_ADMIN.metaDescription ?? NETWORK_ADMIN.subtitle,
  alternates: { canonical: '/programs/network-administration' },
};

export default function Page() {
  return <ProgramDetailPage program={NETWORK_ADMIN} />;
}
