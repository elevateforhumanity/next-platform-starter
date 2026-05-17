/**
 * GET /api/admin/site-health?url=<encoded-url>
 *
 * Server-side proxy for the dashboard Site Status panel.
 * The browser cannot HEAD external URLs directly due to CORS, so this
 * route does the check server-side and returns { ok, latencyMs }.
 *
 * Admin-only. Returns boolean flags only — never leaks error details.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Short timeout — this is a liveness check, not a full page load
export const maxDuration = 10;

// Allowlist — only check known Elevate domains
const ALLOWED_HOSTS = [
  'www.elevateforhumanity.org',
  'elevateforhumanity.org',
  'admin.elevateforhumanity.org',
  'lms.elevateforhumanity.org',
];

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) return safeError('url param required', 400);

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return safeError('Invalid URL', 400);
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return safeError('URL not in allowlist', 403);
  }

  const start = Date.now();
  try {
    const res = await fetch(parsed.toString(), {
      method: 'HEAD',
      // 6 second hard timeout — site check should be fast
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'ElevateAdmin/1.0 (site-health-check)' },
    });
    return NextResponse.json({ ok: res.ok, latencyMs: Date.now() - start });
  } catch {
    return NextResponse.json({ ok: false, latencyMs: Date.now() - start });
  }
}
