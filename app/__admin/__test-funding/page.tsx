import { requireRole } from '@/lib/auth/require-role';
import { TestFundingPageClient } from './TestFundingPageClient';

export const dynamic = 'force-dynamic';

export default async function TestFundingPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <TestFundingPageClient />;
}
