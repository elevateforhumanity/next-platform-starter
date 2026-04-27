import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import heroBanners from '@/content/heroBanners';

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    BARBER_APPRENTICESHIP.metaTitle ?? `${BARBER_APPRENTICESHIP.title} | Elevate for Humanity`,
  description: BARBER_APPRENTICESHIP.metaDescription ?? BARBER_APPRENTICESHIP.subtitle,
  alternates: { canonical: '/programs/barber-apprenticeship' },
};

export default function Page() {
  const banner = heroBanners['barber-apprenticeship'] ?? null;
  return <ProgramDetailPage program={BARBER_APPRENTICESHIP} banner={banner} />;
}
