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
  return fetch(input, {
    ...init,
    signal: controller.signal,
    headers: {
      Connection: 'keep-alive',
      ...(init?.headers as Record<string, string> | undefined),
    },
  }).finally(() => clearTimeout(timer));
}
