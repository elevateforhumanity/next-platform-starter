/**
 * GET /api/admin/audit-logs
 *
 * Alias for /api/audit-logs — the admin audit-logs page calls this path.
 * Forwards all query params unchanged.
 */
import { type NextRequest } from 'next/server';
import { GET as auditLogsGET } from '@/app/api/audit-logs/route';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return auditLogsGET(request);
}
