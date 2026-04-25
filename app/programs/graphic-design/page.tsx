import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { GRAPHIC_DESIGN } from '@/data/programs/graphic-design';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: GRAPHIC_DESIGN.metaTitle ?? `${GRAPHIC_DESIGN.title} | Elevate for Humanity`,
  description: GRAPHIC_DESIGN.metaDescription ?? GRAPHIC_DESIGN.subtitle,
  alternates: { canonical: '/programs/graphic-design' },
};

export default function Page() {
  return <ProgramDetailPage program={GRAPHIC_DESIGN} />;
}
