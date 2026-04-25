import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PHARMACY_TECHNICIAN } from '@/data/programs/pharmacy-technician';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: PHARMACY_TECHNICIAN.metaTitle ?? `${PHARMACY_TECHNICIAN.title} | Elevate for Humanity`,
  description: PHARMACY_TECHNICIAN.metaDescription ?? PHARMACY_TECHNICIAN.subtitle,
  alternates: { canonical: '/programs/pharmacy-technician' },
};

export default function Page() {
  return <ProgramDetailPage program={PHARMACY_TECHNICIAN} />;
}
