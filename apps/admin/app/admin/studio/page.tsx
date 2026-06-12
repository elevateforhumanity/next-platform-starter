import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { PERMISSIONS } from '@/lib/rbac/role-matrix';

export default async function StudioIndexPage() {
  await requireRole(PERMISSIONS.access_devstudio);
  redirect('/admin/dev-studio?tab=courses');
}
