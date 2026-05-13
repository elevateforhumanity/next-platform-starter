import type { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import heroBanners from '@/content/heroBanners';
import { ELECTRICAL } from '@/data/programs/electrical';
import { validateProgram } from '@/lib/programs/program-schema';
import { createClient } from '@/lib/supabase/server';
import ElectricalProgramPageClient from './ElectricalProgramPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const errors = validateProgram(ELECTRICAL);
if (errors.length > 0) {
  throw new Error(
    `Electrical program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: ELECTRICAL.metaTitle,
  description: ELECTRICAL.metaDescription,
  alternates: { canonical: '/programs/electrical' },
};

export default async function ElectricalProgramPage() {
  const heroBanner = heroBanners.electrical ?? null;

  let enrollmentCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_slug', ELECTRICAL.slug)
      .eq('status', 'active');
    enrollmentCount = count ?? 0;
  } catch {
    // non-fatal — fall back to 0
  }

  return (
    <>
      <ProgramStructuredData
        program={{
          id: ELECTRICAL.slug,
          name: ELECTRICAL.title,
          slug: ELECTRICAL.slug,
          description: ELECTRICAL.subtitle,
          duration_weeks: ELECTRICAL.durationWeeks,
          price: parseInt(ELECTRICAL.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: ELECTRICAL.heroImage,
          category: ELECTRICAL.category,
          outcomes: ELECTRICAL.outcomes.map((o) => o.statement),
        }}
      />
      <ElectricalProgramPageClient heroBanner={heroBanner} enrollmentCount={enrollmentCount} />
    </>
  );
}
