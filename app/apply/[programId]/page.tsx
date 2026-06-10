import { redirect } from 'next/navigation';

export default async function ProgramApplyRedirect({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  redirect(`/apply?program=${encodeURIComponent(programId)}`);
}
