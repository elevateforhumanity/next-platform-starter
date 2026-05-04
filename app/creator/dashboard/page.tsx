import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function CreatorDashboardPage() {
  await requireRole(['creator', 'admin', 'super_admin']);
  redirect('/creator/products');
}
