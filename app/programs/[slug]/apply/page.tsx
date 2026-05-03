import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ProgramApplyPage from '@/components/programs/ProgramApplyPage';
import { getStaticProgram } from '@/data/programs/index';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = getStaticProgram(slug);
  if (!program) return { robots: { index: false } };
  return {
    title: `Apply — ${program.title} | Elevate for Humanity`,
    description: `Apply for the ${program.title} program at Elevate for Humanity.`,
    robots: { index: false },
  };
}

export default async function ProgramApplyRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = getStaticProgram(slug);

  // Known program with full static data — render the apply page
  if (program) return <ProgramApplyPage program={program} />;

  // Unknown slug — fall back to generic intake form
  redirect(`/apply?program=${encodeURIComponent(slug)}`);
}
