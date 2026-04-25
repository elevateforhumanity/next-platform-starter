import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { IT_HELP_DESK } from '@/data/programs/it-help-desk';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: IT_HELP_DESK.metaTitle ?? `${IT_HELP_DESK.title} | Elevate for Humanity`,
  description: IT_HELP_DESK.metaDescription ?? IT_HELP_DESK.subtitle,
  alternates: { canonical: '/programs/it-help-desk' },
};

export default function Page() {
  return <ProgramDetailPage program={IT_HELP_DESK} />;
}
