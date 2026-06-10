import { redirect } from 'next/navigation';

export default async function PartnerProgramEditRedirect({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  redirect(`/partner/courses/create?programId=${encodeURIComponent(programId)}`);
}
