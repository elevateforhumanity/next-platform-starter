import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PLUMBING } from '@/data/programs/plumbing';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PLUMBING.metaTitle ?? `${PLUMBING.title} | Elevate for Humanity`,
  description: PLUMBING.metaDescription ?? PLUMBING.subtitle,
  alternates: { canonical: '/programs/plumbing' },
};

export default function Page() {
  return <ProgramDetailPage program={PLUMBING} />;
}
