import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BOOKKEEPING } from '@/data/programs/bookkeeping';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: BOOKKEEPING.metaTitle ?? `${BOOKKEEPING.title} | Elevate for Humanity`,
  description: BOOKKEEPING.metaDescription ?? BOOKKEEPING.subtitle,
  alternates: { canonical: '/programs/bookkeeping' },
};

export default function Page() {
  const banner = heroBanners['bookkeeping'] ?? null;
  return <ProgramDetailPage program={BOOKKEEPING} banner={banner} />;
}
