import { requireRole } from '@/lib/auth/require-role';
import CourseGeneratorClient from './CourseGeneratorClient';

export const dynamic = 'force-dynamic';

export default async function CourseGeneratorPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <CourseGeneratorClient />;
}
