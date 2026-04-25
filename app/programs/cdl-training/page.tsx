import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { CDL_TRAINING } from '@/data/programs/cdl-training';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CDL_TRAINING.metaTitle ?? `${CDL_TRAINING.title} | Elevate for Humanity`,
  description: CDL_TRAINING.metaDescription ?? CDL_TRAINING.subtitle,
  alternates: { canonical: '/programs/cdl-training' },
};

export default function Page() {
  return <ProgramDetailPage program={CDL_TRAINING} />;
}
