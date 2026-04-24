import { requireRole } from '@/lib/auth/require-role';
import { DataImportPageClient } from './DataImportPageClient';

export const dynamic = 'force-dynamic';

export default async function DataImportPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <DataImportPageClient />;
}
