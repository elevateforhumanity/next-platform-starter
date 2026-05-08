import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function LegacyApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff', 'org_admin']);
  const { id } = await params;
  redirect(`/admin/applications/review/${id}`);
}
