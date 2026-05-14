import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStaticProgram } from '@/data/programs/index';

export const metadata: Metadata = {
  title: 'Welding Technology Training | AWS Certification Prep | Elevate for Humanity',
  description:
    'Learn MIG, TIG, and stick welding in 10 weeks. Prepare for AWS certifications and enter the skilled trades workforce. WIOA funding available for eligible Indiana residents.',
  alternates: { canonical: '/programs/welding' },
};

import ProgramDetailPageComponent from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';

export default function WeldingProgramPage() {
  const program = getStaticProgram('welding');
  if (!program) return notFound();

  return (
    <>
      <ProgramStructuredData
        program={{
          id: program.slug,
          name: program.title,
          slug: program.slug,
          description: program.subtitle,
          duration_weeks: program.durationWeeks,
          price: parseInt(program.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: program.heroImage,
          category: program.category,
          outcomes: program.outcomes.map((o) => o.statement),
        }}
      />
      <ProgramDetailPageComponent program={program} />
      <OnetLaborData slug="welding" />
    </>
  );
}
