import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { WELDING } from '@/data/programs/welding';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: WELDING.metaTitle ?? `${WELDING.title} | Elevate for Humanity`,
  description: WELDING.metaDescription ?? WELDING.subtitle,
  alternates: { canonical: '/programs/welding' },
};

export default function Page() {
  return <ProgramDetailPage program={WELDING} />;
}
