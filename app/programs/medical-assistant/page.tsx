import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { MEDICAL_ASSISTANT } from '@/data/programs/medical-assistant';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: MEDICAL_ASSISTANT.metaTitle ?? `${MEDICAL_ASSISTANT.title} | Elevate for Humanity`,
  description: MEDICAL_ASSISTANT.metaDescription ?? MEDICAL_ASSISTANT.subtitle,
  alternates: { canonical: '/programs/medical-assistant' },
};

export default function Page() {
  return <ProgramDetailPage program={MEDICAL_ASSISTANT} />;
}
