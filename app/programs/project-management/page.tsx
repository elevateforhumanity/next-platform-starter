import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PROJECT_MANAGEMENT } from '@/data/programs/project-management';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PROJECT_MANAGEMENT.metaTitle ?? `${PROJECT_MANAGEMENT.title} | Elevate for Humanity`,
  description: PROJECT_MANAGEMENT.metaDescription ?? PROJECT_MANAGEMENT.subtitle,
  alternates: { canonical: '/programs/project-management' },
};

export default function Page() {
  return <ProgramDetailPage program={PROJECT_MANAGEMENT} />;
}
