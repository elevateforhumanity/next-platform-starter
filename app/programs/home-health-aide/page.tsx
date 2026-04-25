import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { HOME_HEALTH_AIDE } from '@/data/programs/home-health-aide';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: HOME_HEALTH_AIDE.metaTitle ?? `${HOME_HEALTH_AIDE.title} | Elevate for Humanity`,
  description: HOME_HEALTH_AIDE.metaDescription ?? HOME_HEALTH_AIDE.subtitle,
  alternates: { canonical: '/programs/home-health-aide' },
};

export default function Page() {
  return <ProgramDetailPage program={HOME_HEALTH_AIDE} />;
}
