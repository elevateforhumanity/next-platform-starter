import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { TECHNOLOGY } from '@/data/programs/technology';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: TECHNOLOGY.metaTitle ?? `${TECHNOLOGY.title} | Elevate for Humanity`,
  description: TECHNOLOGY.metaDescription ?? TECHNOLOGY.subtitle,
  alternates: { canonical: '/programs/technology' },
};

export default function Page() {
  return <ProgramDetailPage program={TECHNOLOGY} />;
}
