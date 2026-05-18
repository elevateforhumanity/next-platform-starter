import { logger } from '@/lib/logger';
/**
 * Runtime secrets fetched from Supabase `app_secrets` table and merged
 * into process.env so existing code continues to work unchanged.
 *
 * Why: Netlify injects all site env vars into every Lambda function.
 * With 160+ vars the serialized payload exceeds AWS Lambda's 4 KB limit,
 * causing deploys to fail (HTTP 400). This module keeps only 3 bootstrap
 * vars in Netlify env and loads the rest from Supabase at runtime.
 *
 * Bootstrap vars (stay in Netlify):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage — explicit fetch:
 *   import { getSecret, getSecrets } from '@/lib/secrets';
 *   const key = await getSecret('STRIPE_SECRET_KEY');
 *
 * Usage — hydrate process.env (call once at startup):
 *   import { hydrateProcessEnv } from '@/lib/secrets';
 *   await hydrateProcessEnv();
 *   // now process.env.STRIPE_SECRET_KEY works as before
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cache: Record<string, string> | null = null;
let cacheTimestamp = 0;
let hydrated = false;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — survives warm Lambda reuse

// Abort app_secrets fetch if Supabase doesn't respond within this window.
// Without a timeout, a cold Lambda with no service role key hangs for 60s+
// on every request, cascading into audit timeouts and slow cold starts.
const SECRETS_FETCH_TIMEOUT_MS = 3000;

function getBootstrapClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // Per-request AbortSignal timeout — prevents indefinite hangs on cold starts.
      fetch: (input, init) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SECRETS_FETCH_TIMEOUT_MS);
        return fetch(input, { ...init, signal: controller.signal }).finally(() =>
          clearTimeout(timer),
        );
      },
    },
  });
}

async function loadSecrets(): Promise<Record<string, string>> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }

  const client = getBootstrapClient();
  if (!client) {
    // SUPABASE_SERVICE_ROLE_KEY absent — local dev or Lambda before secret injection.
    // Fall through to process.env; requireAdminClient() will return null and callers
    // must handle that gracefully.
    return {};
  }

  const secrets: Record<string, string> = {};

  // 1. Load from app_secrets (runtime scope) — legacy/bootstrap secrets
  try {
    const result = await client.from('app_secrets').select('key, value').eq('scope', 'runtime');
    if (!result.error) {
      for (const row of result.data ?? []) {
        if (row.key && row.value) secrets[row.key] = row.value;
      }
    } else {
      logger.error('Failed to load from app_secrets', result.error);
    }
  } catch (e) {
    logger.error('Failed to load from app_secrets', e instanceof Error ? e : undefined);
  }

  // 2. Load from platform_secrets — keys saved via admin Secrets tab.
  //    These take precedence over app_secrets so admins can rotate without a deploy.
  try {
    const result = await client.from('platform_secrets').select('key, value_enc');
    if (!result.error) {
      for (const row of result.data ?? []) {
        if (row.key && row.value_enc) secrets[row.key] = row.value_enc;
      }
    } else {
      logger.error('Failed to load from platform_secrets', result.error);
    }
  } catch (e) {
    logger.error('Failed to load from platform_secrets', e instanceof Error ? e : undefined);
  }

  cache = secrets;
  cacheTimestamp = Date.now();
  return secrets;
}

/**
 * Merge all runtime secrets into process.env.
 *
 * Precedence (highest → lowest):
 *   1. platform_secrets (admin UI) — always wins, enables key rotation without redeploy
 *   2. app_secrets (legacy runtime scope)
 *   3. process.env (ECS task definition / build-time vars)
 *
 * Previously process.env took precedence, which meant keys set via the admin
 * Integrations UI were silently ignored whenever a stale or empty value existed
 * in the task definition environment.
 */
export async function hydrateProcessEnv(): Promise<void> {
  if (hydrated && Date.now() - cacheTimestamp < CACHE_TTL_MS) return;

  const secrets = await loadSecrets();
  for (const [key, value] of Object.entries(secrets)) {
    // platform_secrets and app_secrets always override the ambient environment.
    // This ensures keys rotated via the admin UI take effect immediately.
    process.env[key] = value;
  }
  hydrated = true;
}

/** Get a single secret. Falls back to process.env. */
export async function getSecret(key: string): Promise<string | undefined> {
  const secrets = await loadSecrets();
  return secrets[key] ?? process.env[key];
}

/** Get multiple secrets. Falls back to process.env per key. */
export async function getSecrets<K extends string>(
  keys: K[],
): Promise<Record<K, string | undefined>> {
  const secrets = await loadSecrets();
  const result = {} as Record<K, string | undefined>;
  for (const key of keys) {
    result[key] = secrets[key] ?? process.env[key];
  }
  return result;
}

/** Synchronous read from cache. Only works after hydrate/getSecret has run. */
export function getCachedSecret(key: string): string | undefined {
  return cache?.[key] ?? process.env[key];
}

/** Force-refresh (e.g., after rotating a secret via admin UI). */
export async function refreshSecrets(): Promise<void> {
  cache = null;
  cacheTimestamp = 0;
  hydrated = false;
  await hydrateProcessEnv();
}
