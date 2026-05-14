import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStaticProgram } from '@/data/programs/index';

export const metadata: Metadata = {
  title: 'Peer Recovery Specialist (CPRS) | Indiana Certification | Elevate for Humanity',
  description:
    'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. WIOA funding available. Help others overcome addiction and mental health challenges.',
  alternates: { canonical: '/programs/peer-recovery-specialist' },
};

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
