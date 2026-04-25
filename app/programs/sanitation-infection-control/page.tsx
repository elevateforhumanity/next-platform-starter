import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { SANITATION } from '@/data/programs/sanitation-infection-control';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: SANITATION.metaTitle ?? `${SANITATION.title} | Elevate for Humanity`,
  description: SANITATION.metaDescription ?? SANITATION.subtitle,
  alternates: { canonical: '/programs/sanitation-infection-control' },
};

export default function Page() {
  return <ProgramDetailPage program={SANITATION} />;
}
