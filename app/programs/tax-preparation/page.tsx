import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { TAX_PREPARATION } from '@/data/programs/tax-preparation';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: TAX_PREPARATION.metaTitle ?? `${TAX_PREPARATION.title} | Elevate for Humanity`,
  description: TAX_PREPARATION.metaDescription ?? TAX_PREPARATION.subtitle,
  alternates: { canonical: '/programs/tax-preparation' },
};

export default function Page() {
  return <ProgramDetailPage program={TAX_PREPARATION} />;
}
