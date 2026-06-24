import { redirect } from 'next/navigation';

// Redirect to the canonical workflow detail page
export default async function StudioWorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/workflows/${id}`);
}
