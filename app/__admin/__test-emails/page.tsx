import { requireRole } from '@/lib/auth/require-role';
import { TestEmailsPageClient } from './TestEmailsPageClient';

export const dynamic = 'force-dynamic';

export default async function TestEmailsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <TestEmailsPageClient />;
}
