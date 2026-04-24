import { requireRole } from '@/lib/auth/require-role';
import { TestWebhookPageClient } from './TestWebhookPageClient';

export const dynamic = 'force-dynamic';

export default async function TestWebhookPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <TestWebhookPageClient />;
}
