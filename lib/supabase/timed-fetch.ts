/**
 * timedFetch — fetch with hard timeout for all Supabase clients.
 *
 * Without this, a stalled TCP connection to Supabase waits ~22s before
 * the OS gives up. On Netlify this shows as 21-23s Lambda durations.
 *
 * Keep-alive header reuses TCP connections across invocations within the
 * same warm Lambda instance, reducing cold-start connection overhead.
 */
const SUPABASE_FETCH_TIMEOUT_MS = 8_000;

export function timedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);

  // Normalize headers — init.headers may be a Headers instance, a plain object,
  // or an array of [key, value] pairs. Spreading a Headers instance produces {}
  // which silently drops apikey/Authorization, causing "No API key" from Supabase.
  const existingHeaders = init?.headers
    ? Object.fromEntries(
        init.headers instanceof Headers
          ? init.headers.entries()
          : Array.isArray(init.headers)
            ? init.headers
            : Object.entries(init.headers),
      )
    : {};

  return fetch(input, {
    ...init,
    signal: controller.signal,
    headers: {
      'Connection': 'keep-alive',
      ...existingHeaders,
    },
  }).finally(() => clearTimeout(timer));
}
