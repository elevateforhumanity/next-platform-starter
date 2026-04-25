import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BEAUTY_CAREER_EDUCATOR } from '@/data/programs/beauty-career-educator';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: BEAUTY_CAREER_EDUCATOR.metaTitle ?? `${BEAUTY_CAREER_EDUCATOR.title} | Elevate for Humanity`,
  description: BEAUTY_CAREER_EDUCATOR.metaDescription ?? BEAUTY_CAREER_EDUCATOR.subtitle,
  alternates: { canonical: '/programs/beauty-career-educator' },
};

export default function Page() {
  return <ProgramDetailPage program={BEAUTY_CAREER_EDUCATOR} />;
}
