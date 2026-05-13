import 'server-only';
// Never initialize at module load — STRIPE_SECRET_KEY lives in app_secrets
// and is only available after hydrateProcessEnv() runs at request time.
// Callers must use getStripe() after hydrating secrets.

type StripeInstance = import('stripe').default;

let _StripeClass: typeof import('stripe').default | null = null;

/**
 * Returns a fresh Stripe client using the current process.env value.
 * Always call after hydrateProcessEnv() so the key is populated.
 * Returns null if the key is still missing (misconfiguration).
 *
 * Stripe SDK is require()'d lazily on first call so it is not traced into
 * routes that never invoke this function.
 */
// Treat misconfiguration sentinels as missing rather than letting Stripe SDK
// throw `Invalid API Key provided: skip` at runtime. Real Stripe keys begin
// with sk_ or rk_; anything else (build-time placeholders, "skip", "") is
// treated as not configured and the caller gets a clean null.
function isUsableStripeKey(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 10) return false;
  return trimmed.startsWith('sk_') || trimmed.startsWith('rk_');
}

export function getStripe(): StripeInstance | null {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY;
  if (!isUsableStripeKey(key)) return null;
  if (!_StripeClass) {
    _StripeClass = require('stripe').default ?? require('stripe');
  }
  return new _StripeClass!(key, {
    apiVersion: '2025-10-29.clover' as any,
    typescript: true,
  });
}

// Module-level export for callers that import `stripe` directly.
// Resolves at import time using whatever key is in process.env at that moment.
// Always null-check before use — key may be absent at build time.
export const stripe: Stripe | null = getStripe();
