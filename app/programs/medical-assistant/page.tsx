import type { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import heroBanners from '@/content/heroBanners';
import { MEDICAL_ASSISTANT } from '@/data/programs/medical-assistant';
import { validateProgram } from '@/lib/programs/program-schema';
import { createClient } from '@/lib/supabase/server';
import MedicalAssistantProgramPageClient from './MedicalAssistantProgramPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const errors = validateProgram(MEDICAL_ASSISTANT);
if (errors.length > 0) {
  throw new Error(
    `Medical Assistant program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: MEDICAL_ASSISTANT.metaTitle,
  description: MEDICAL_ASSISTANT.metaDescription,
  alternates: { canonical: '/programs/medical-assistant' },
};

export default async function MedicalAssistantProgramPage() {
  const heroBanner = heroBanners['medical-assistant'] ?? null;

  let enrollmentCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_slug', MEDICAL_ASSISTANT.slug)
      .eq('status', 'active');
    enrollmentCount = count ?? 0;
  } catch {
    // non-fatal — fall back to 0
  }

  return (
    <>
      <ProgramStructuredData
        program={{
          id: MEDICAL_ASSISTANT.slug,
          name: MEDICAL_ASSISTANT.title,
          slug: MEDICAL_ASSISTANT.slug,
          description: MEDICAL_ASSISTANT.subtitle,
          duration_weeks: MEDICAL_ASSISTANT.durationWeeks,
          price: parseInt(MEDICAL_ASSISTANT.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: MEDICAL_ASSISTANT.heroImage,
          category: MEDICAL_ASSISTANT.category,
          outcomes: MEDICAL_ASSISTANT.outcomes.map((o) => o.statement),
        }}
      />
      <MedicalAssistantProgramPageClient heroBanner={heroBanner} enrollmentCount={enrollmentCount} />
    </>
  );
}
