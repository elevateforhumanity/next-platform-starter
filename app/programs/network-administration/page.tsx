import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NETWORK_ADMIN } from '@/data/programs/network-administration';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NETWORK_ADMIN.metaTitle ?? `${NETWORK_ADMIN.title} | Elevate for Humanity`,
  description: NETWORK_ADMIN.metaDescription ?? NETWORK_ADMIN.subtitle,
  alternates: { canonical: '/programs/network-administration' },
};

export default function Page() {
  const banner = heroBanners['network-administration'] ?? null;
  return <ProgramDetailPage program={NETWORK_ADMIN} banner={banner} />;
}
