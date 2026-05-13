import type { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { PLUMBING } from '@/data/programs/plumbing';
import { validateProgram } from '@/lib/programs/program-schema';
import { createClient } from '@/lib/supabase/server';
import PlumbingProgramPageClient from './PlumbingProgramPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const errors = validateProgram(PLUMBING);
if (errors.length > 0) {
  throw new Error(
    `Plumbing program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: PLUMBING.metaTitle,
  description: PLUMBING.metaDescription,
  alternates: { canonical: '/programs/plumbing' },
};

export default async function PlumbingProgramPage() {
  let enrollmentCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_slug', PLUMBING.slug)
      .eq('status', 'active');
    enrollmentCount = count ?? 0;
  } catch {
    // non-fatal — fall back to 0
  }

  return (
    <>
      <ProgramStructuredData
        program={{
          id: PLUMBING.slug,
          name: PLUMBING.title,
          slug: PLUMBING.slug,
          description: PLUMBING.subtitle,
          duration_weeks: PLUMBING.durationWeeks,
          price: parseInt(PLUMBING.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: PLUMBING.heroImage,
          category: PLUMBING.category,
          outcomes: PLUMBING.outcomes.map((o) => o.statement),
        }}
      />
      <PlumbingProgramPageClient enrollmentCount={enrollmentCount} />
    </>
  );
}
