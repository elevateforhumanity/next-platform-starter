import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { IT_HELP_DESK } from '@/data/programs/it-help-desk';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: IT_HELP_DESK.metaTitle ?? `${IT_HELP_DESK.title} | Elevate for Humanity`,
  description: IT_HELP_DESK.metaDescription ?? IT_HELP_DESK.subtitle,
  alternates: { canonical: '/programs/it-help-desk' },
};

export default function Page() {
  const banner = heroBanners['it-help-desk'] ?? null;
  return <ProgramDetailPage program={IT_HELP_DESK} banner={banner} />;
}
