import type { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';
import { createClient } from '@/lib/supabase/server';
import { COSMETOLOGY_PROGRAM_ID } from '@/lib/cosmetology/pricing';
import CosmetologyApprenticeshipClient from './CosmetologyApprenticeshipClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const errors = validateProgram(COSMETOLOGY);
if (errors.length > 0) {
  throw new Error(
    `Cosmetology Apprenticeship schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: COSMETOLOGY.metaTitle,
  description: COSMETOLOGY.metaDescription,
  alternates: { canonical: '/programs/cosmetology-apprenticeship' },
  openGraph: {
    title: COSMETOLOGY.title,
    description: COSMETOLOGY.subtitle,
  },
};

export default async function CosmetologyApprenticeshipPage() {
  let enrollmentCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', COSMETOLOGY_PROGRAM_ID)
      .eq('status', 'active');
    enrollmentCount = count ?? 0;
  } catch {
    // non-fatal — fall back to 0
  }

  return (
    <>
      <ProgramStructuredData
        program={{
          id: COSMETOLOGY.slug,
          name: COSMETOLOGY.title,
          slug: COSMETOLOGY.slug,
          description: COSMETOLOGY.subtitle,
          duration_weeks: COSMETOLOGY.durationWeeks,
          price: 4980,
          image_url: COSMETOLOGY.heroImage,
          category: COSMETOLOGY.category,
          outcomes: COSMETOLOGY.outcomes.map((o) => o.statement),
        }}
      />
      <CosmetologyApprenticeshipClient program={COSMETOLOGY} enrollmentCount={enrollmentCount} />
    </>
  );
}
