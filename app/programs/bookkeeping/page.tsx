import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BOOKKEEPING } from '@/data/programs/bookkeeping';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: BOOKKEEPING.metaTitle ?? `${BOOKKEEPING.title} | Elevate for Humanity`,
  description: BOOKKEEPING.metaDescription ?? BOOKKEEPING.subtitle,
  alternates: { canonical: '/programs/bookkeeping' },
};

export default function Page() {
  return <ProgramDetailPage program={BOOKKEEPING} />;
}
