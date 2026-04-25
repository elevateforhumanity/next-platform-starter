import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CNA } from '@/data/programs/cna';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CNA.metaTitle ?? `${CNA.title} | Elevate for Humanity`,
  description: CNA.metaDescription ?? CNA.subtitle,
  alternates: { canonical: '/programs/cna' },
};

export default function Page() {
  return <ProgramDetailPage program={CNA} />;
}
