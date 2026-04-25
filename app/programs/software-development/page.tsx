import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { SOFTWARE_DEV } from '@/data/programs/software-development';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: SOFTWARE_DEV.metaTitle ?? `${SOFTWARE_DEV.title} | Elevate for Humanity`,
  description: SOFTWARE_DEV.metaDescription ?? SOFTWARE_DEV.subtitle,
  alternates: { canonical: '/programs/software-development' },
};

export default function Page() {
  const banner = heroBanners['software-development'] ?? null;
  return <ProgramDetailPage program={SOFTWARE_DEV} banner={banner} />;
}
