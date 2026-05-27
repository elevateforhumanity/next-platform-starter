import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function AdminLegacyLandingPage() {
  // Canonical landing route is /admin/dashboard.
  await requireAdmin();
  redirect('/admin/dashboard');
}
