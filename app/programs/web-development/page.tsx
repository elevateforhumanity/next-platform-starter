import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { WEB_DEVELOPMENT } from '@/data/programs/web-development';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: WEB_DEVELOPMENT.metaTitle ?? `${WEB_DEVELOPMENT.title} | Elevate for Humanity`,
  description: WEB_DEVELOPMENT.metaDescription ?? WEB_DEVELOPMENT.subtitle,
  alternates: { canonical: '/programs/web-development' },
};

export default function Page() {
  const banner = heroBanners['web-development'] ?? null;
  return <ProgramDetailPage program={WEB_DEVELOPMENT} banner={banner} />;
}
