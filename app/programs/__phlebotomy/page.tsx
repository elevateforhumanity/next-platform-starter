import { requireRole } from '@/lib/auth/require-role';
import { getEnrollmentCount } from '@/lib/programs/getEnrollmentCount';
import { PhlebotomyProgramPageClient } from './PhlebotomyProgramPageClient';

export const dynamic = 'force-dynamic';

export default async function PhlebotomyProgramPage() {
  const enrollmentCount = await getEnrollmentCount('phlebotomy-technician');
  return <PhlebotomyProgramPageClient enrollmentCount={enrollmentCount} />;
}
