import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

// Instructor portal lives in the admin app. Redirect there after auth check.
export default async function InstructorDashboardPage() {
  await requireRole(['instructor', 'admin', 'super_admin', 'staff']);
  redirect('https://admin.elevateforhumanity.org/instructor');
}
