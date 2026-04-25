import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ENTREPRENEURSHIP } from '@/data/programs/entrepreneurship';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ENTREPRENEURSHIP.metaTitle ?? `${ENTREPRENEURSHIP.title} | Elevate for Humanity`,
  description: ENTREPRENEURSHIP.metaDescription ?? ENTREPRENEURSHIP.subtitle,
  alternates: { canonical: '/programs/entrepreneurship' },
};

export default function Page() {
  return <ProgramDetailPage program={ENTREPRENEURSHIP} />;
}
