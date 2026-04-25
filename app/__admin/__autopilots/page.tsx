import { requireRole } from '@/lib/auth/require-role';
import { AutopilotsPageClient } from './AutopilotsPageClient';

export const dynamic = 'force-dynamic';

export default async function AutopilotsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <AutopilotsPageClient />;
}
