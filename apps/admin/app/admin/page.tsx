import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function AdminLegacyLandingPage() {
  // Canonical landing route is /admin/dashboard.
  await requireRole(['admin', 'super_admin', 'staff']);
  redirect('/admin/dashboard');
}
