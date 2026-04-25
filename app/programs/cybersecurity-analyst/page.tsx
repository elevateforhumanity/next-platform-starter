import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CYBERSECURITY_ANALYST } from '@/data/programs/cybersecurity-analyst';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CYBERSECURITY_ANALYST.metaTitle ?? `${CYBERSECURITY_ANALYST.title} | Elevate for Humanity`,
  description: CYBERSECURITY_ANALYST.metaDescription ?? CYBERSECURITY_ANALYST.subtitle,
  alternates: { canonical: '/programs/cybersecurity-analyst' },
};

export default function Page() {
  const banner = heroBanners['cybersecurity-analyst'] ?? null;
  return <ProgramDetailPage program={CYBERSECURITY_ANALYST} banner={banner} />;
}
