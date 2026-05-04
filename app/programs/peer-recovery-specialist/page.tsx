import { notFound } from 'next/navigation';
import { getStaticProgram } from '@/data/programs/index';
import ProgramDetailPageComponent from '@/components/programs/ProgramDetailPage';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { OnetLaborData } from '@/components/programs/onet/OnetLaborData';

export default function PeerRecoverySpecialistProgramPage() {
  const program = getStaticProgram('peer-recovery-specialist');
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
      <OnetLaborData slug="peer-recovery-specialist" />
    </>
  );
}
