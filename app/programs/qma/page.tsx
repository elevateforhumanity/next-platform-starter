import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStaticProgram } from '@/data/programs/index';

export const metadata: Metadata = {
  title: 'Qualified Medication Aide (QMA) Certification | Indiana | Elevate for Humanity',
  description:
    'Indiana state QMA certification in 4 weeks. Administer medications under nurse supervision in residential care settings. WIOA and WRG funding available for eligible participants. Self-pay: $1,200.',
  alternates: { canonical: '/programs/qma' },
};

import ProgramDetailPageComponent from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';

export default function QMAProgramPage() {
  const program = getStaticProgram('qma');
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
      <OnetLaborData slug="qma" />
    </>
  );
}
