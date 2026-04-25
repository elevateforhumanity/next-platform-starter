import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { SOFTWARE_DEV } from '@/data/programs/software-development';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: SOFTWARE_DEV.metaTitle ?? `${SOFTWARE_DEV.title} | Elevate for Humanity`,
  description: SOFTWARE_DEV.metaDescription ?? SOFTWARE_DEV.subtitle,
  alternates: { canonical: '/programs/software-development' },
};

export default function Page() {
  return <ProgramDetailPage program={SOFTWARE_DEV} />;
}
