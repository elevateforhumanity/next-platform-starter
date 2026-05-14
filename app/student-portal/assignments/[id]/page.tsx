import { permanentRedirect } from 'next/navigation';

export default async function StudentPortalAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/lms/assignments/${id}`);
}
