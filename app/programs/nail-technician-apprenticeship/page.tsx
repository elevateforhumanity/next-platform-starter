import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: NAIL_TECH.metaTitle ?? `${NAIL_TECH.title} | Elevate for Humanity`,
  description: NAIL_TECH.metaDescription ?? NAIL_TECH.subtitle,
  alternates: { canonical: '/programs/nail-technician-apprenticeship' },
};

export default function Page() {
  return <ProgramDetailPage program={NAIL_TECH} />;
}
