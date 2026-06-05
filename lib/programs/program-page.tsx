import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import heroBanners from '@/content/heroBanners';

export function buildProgramMetadata(program: ProgramSchema): Metadata {
  return {
    title: program.metaTitle,
    description: program.metaDescription,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/programs/${program.slug}`,
    },
  };
}

export function ProgramMarketingPage({
  program,
  announcement,
}: {
  program: ProgramSchema;
  announcement?: ReactNode;
}) {
  const banner = heroBanners[program.slug] ?? null;
  return (
    <ProgramDetailPage program={program} banner={banner} announcement={announcement} />
  );
}
