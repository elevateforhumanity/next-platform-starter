/**
 * GET /api/admin/audit-logs
 *
 * Alias for /api/audit-logs — the admin audit-logs page calls this path.
 * Forwards all query params unchanged.
 */
import { type NextRequest } from 'next/server';
import { GET as auditLogsGET } from '@/app/api/audit-logs/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return auditLogsGET(request);
}
