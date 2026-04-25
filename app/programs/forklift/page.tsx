import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { FORKLIFT } from '@/data/programs/forklift';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: FORKLIFT.metaTitle ?? `${FORKLIFT.title} | Elevate for Humanity`,
  description: FORKLIFT.metaDescription ?? FORKLIFT.subtitle,
  alternates: { canonical: '/programs/forklift' },
};

export default function Page() {
  return <ProgramDetailPage program={FORKLIFT} />;
}
