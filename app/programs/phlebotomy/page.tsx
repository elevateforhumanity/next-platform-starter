import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PHLEBOTOMY } from '@/data/programs/phlebotomy';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PHLEBOTOMY.metaTitle ?? `${PHLEBOTOMY.title} | Elevate for Humanity`,
  description: PHLEBOTOMY.metaDescription ?? PHLEBOTOMY.subtitle,
  alternates: { canonical: '/programs/phlebotomy' },
};

export default function Page() {
  return <ProgramDetailPage program={PHLEBOTOMY} />;
}
