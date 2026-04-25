import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { EMERGENCY_HEALTH_SAFETY } from '@/data/programs/emergency-health-safety';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: EMERGENCY_HEALTH_SAFETY.metaTitle ?? `${EMERGENCY_HEALTH_SAFETY.title} | Elevate for Humanity`,
  description: EMERGENCY_HEALTH_SAFETY.metaDescription ?? EMERGENCY_HEALTH_SAFETY.subtitle,
  alternates: { canonical: '/programs/emergency-health-safety' },
};

export default function Page() {
  return <ProgramDetailPage program={EMERGENCY_HEALTH_SAFETY} />;
}
