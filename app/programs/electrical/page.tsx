import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { ELECTRICAL } from '@/data/programs/electrical';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: ELECTRICAL.metaTitle ?? `${ELECTRICAL.title} | Elevate for Humanity`,
  description: ELECTRICAL.metaDescription ?? ELECTRICAL.subtitle,
  alternates: { canonical: '/programs/electrical' },
};

export default function Page() {
  return <ProgramDetailPage program={ELECTRICAL} />;
}
