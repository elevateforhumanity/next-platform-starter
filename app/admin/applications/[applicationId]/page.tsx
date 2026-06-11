import { redirect } from 'next/navigation';

export default async function AdminApplicationDetailRedirect({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  redirect(`/admin/applications?applicationId=${encodeURIComponent(applicationId)}`);
}
