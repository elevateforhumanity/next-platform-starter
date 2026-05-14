import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStaticProgram } from '@/data/programs/index';

export const metadata: Metadata = {
  title: 'CDL Training Program (Class A & B) | Indianapolis | Elevate for Humanity',
  description:
    'Get your CDL Class A or Class B license with hands-on training and job placement support. Get licensed and on the road fast. WIOA funding available for eligible Indiana residents.',
  alternates: { canonical: '/programs/cdl-training' },
};

import ProgramDetailPageComponent from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';

export default function CDLTrainingProgramPage() {
  const program = getStaticProgram('cdl-training');
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
      <OnetLaborData slug="cdl-training" />
    </>
  );
}
