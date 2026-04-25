import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: COSMETOLOGY.metaTitle ?? `${COSMETOLOGY.title} | Elevate for Humanity`,
  description: COSMETOLOGY.metaDescription ?? COSMETOLOGY.subtitle,
  alternates: { canonical: '/programs/cosmetology-apprenticeship' },
};

export default function Page() {
  return <ProgramDetailPage program={COSMETOLOGY} />;
}
