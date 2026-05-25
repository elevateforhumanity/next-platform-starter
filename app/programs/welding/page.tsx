import type { Metadata } from 'next';
import { WELDING } from '@/data/programs/welding';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';

export const metadata: Metadata = {
  title: WELDING.metaTitle ?? `${WELDING.title} | Elevate for Humanity`,
  description: WELDING.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/welding' },
};

export default function WeldingPage() {
  return <ProgramDetailPage program={WELDING} />;
}
