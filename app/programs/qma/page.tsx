import type { Metadata } from 'next';
import { QMA } from '@/data/programs/qma';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';

export const metadata: Metadata = {
  title: QMA.metaTitle ?? `${QMA.title} | Elevate for Humanity`,
  description: QMA.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/qma' },
};

export default function QMAPage() {
  return <ProgramDetailPage program={QMA} />;
}
