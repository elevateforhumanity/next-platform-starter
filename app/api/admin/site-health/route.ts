import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

// Proxy HEAD request to an external URL so the browser doesn't hit CORS.
// Returns { ok, statusCode } — never forwards response body.
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url param required' }, { status: 400 });
  }

  // Only allow https:// targets to prevent SSRF against internal services.
  if (!url.startsWith('https://')) {
    return NextResponse.json({ error: 'Only https:// URLs are allowed' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    return NextResponse.json({ ok: res.ok, statusCode: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unreachable';
    return NextResponse.json({ ok: false, statusCode: null, error: message });
  }
}
