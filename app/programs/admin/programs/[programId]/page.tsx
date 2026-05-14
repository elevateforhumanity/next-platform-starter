import { permanentRedirect } from 'next/navigation';

export default async function ProgramsAdminProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  permanentRedirect(`/program-holder/programs/${programId}`);
}
