import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NETWORK_SUPPORT } from '@/data/programs/network-support-technician';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NETWORK_SUPPORT.metaTitle ?? `${NETWORK_SUPPORT.title} | Elevate for Humanity`,
  description: NETWORK_SUPPORT.metaDescription ?? NETWORK_SUPPORT.subtitle,
  alternates: { canonical: '/programs/network-support-technician' },
};

export default function Page() {
  const banner = heroBanners['network-support-technician'] ?? null;
  return <ProgramDetailPage program={NETWORK_SUPPORT} banner={banner} />;
}
