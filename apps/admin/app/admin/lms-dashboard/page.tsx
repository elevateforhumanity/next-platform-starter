import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLmsDashboardLegacyPage() {
  await requireAdmin();
  redirect('/admin/dashboard');
}
