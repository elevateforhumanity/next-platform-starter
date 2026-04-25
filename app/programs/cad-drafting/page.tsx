import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CAD_DRAFTING } from '@/data/programs/cad-drafting';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CAD_DRAFTING.metaTitle ?? `${CAD_DRAFTING.title} | Elevate for Humanity`,
  description: CAD_DRAFTING.metaDescription ?? CAD_DRAFTING.subtitle,
  alternates: { canonical: '/programs/cad-drafting' },
};

export default function Page() {
  return <ProgramDetailPage program={CAD_DRAFTING} />;
}
