/**
 * api-proxy — Netlify Edge Function
 *
 * Proxies /api/* requests to Railway before the Next.js server handler
 * can intercept them. app/api/ is quarantined from the Netlify build so
 * the Next.js handler has no /api/* routes and returns HTML 404s.
 *
 * Netlify function overrides (/api/file-return, /api/refund-tracking, etc.)
 * are excluded here — they are handled by /.netlify/functions/* rules.
 */

const RAILWAY_URL = Deno.env.get('RAILWAY_URL') ?? '';

// Routes handled by Netlify functions — do not proxy these to Railway
const NETLIFY_FUNCTION_PATHS = new Set([
  '/api/pdf/export',
  '/api/ocr/extract',
  '/api/image/optimize',
  '/api/file-return',
  '/api/refund-tracking',
]);

export default async function handler(request: Request) {
  const url = new URL(request.url);

  // Skip if not an /api/ path
  if (!url.pathname.startsWith('/api/')) return;

  // Skip Netlify-function-handled routes
  if (NETLIFY_FUNCTION_PATHS.has(url.pathname)) return;

  if (!RAILWAY_URL) {
    return new Response(JSON.stringify({ error: 'RAILWAY_URL not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Proxy to Railway, preserving method, headers, and body
  const target = new URL(url.pathname + url.search, RAILWAY_URL);

  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set('X-Forwarded-Host', url.host);
  proxyHeaders.set('X-Forwarded-Proto', 'https');

  const proxyRequest = new Request(target.toString(), {
    method: request.method,
    headers: proxyHeaders,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    // @ts-ignore — Deno fetch supports duplex
    duplex: 'half',
  });

  return fetch(proxyRequest);
}

export const config = { path: '/api/*' };
