import { requireRole } from '@/lib/auth/require-role';
import PageClient from './PageClient';

export { metadata } from './layout';
export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <PageClient />;
}
