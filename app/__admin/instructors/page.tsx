import { requireRole } from '@/lib/auth/require-role';
import PageClient from './PageClient';

export const dynamic = 'force-dynamic';

export default async function InstructorsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <PageClient />;
}
