import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BUSINESS_ADMIN } from '@/data/programs/business-administration';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: BUSINESS_ADMIN.metaTitle ?? `${BUSINESS_ADMIN.title} | Elevate for Humanity`,
  description: BUSINESS_ADMIN.metaDescription ?? BUSINESS_ADMIN.subtitle,
  alternates: { canonical: '/programs/business-administration' },
};

export default function Page() {
  const banner = heroBanners['business-administration'] ?? null;
  return <ProgramDetailPage program={BUSINESS_ADMIN} banner={banner} />;
}
