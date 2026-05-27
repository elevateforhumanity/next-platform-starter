import { requireRole } from '@/lib/auth/require-role';
import SalesforceClient from './SalesforceClient';

export const dynamic = 'force-dynamic';

export default async function SalesforcePage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <SalesforceClient />;
}
