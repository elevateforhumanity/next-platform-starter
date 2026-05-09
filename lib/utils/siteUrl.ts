/**
 * Returns the canonical public site URL.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL env var (trimmed, must be non-empty)
 *   2. Production fallback: https://www.elevateforhumanity.org
 *
 * Never returns localhost — localhost fallbacks in payment/email URLs
 * cause broken links in production when the env var is missing or empty.
 */
export function getSiteUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  return env || 'https://www.elevateforhumanity.org';
}

/**
 * Returns the canonical admin URL.
 */
export function getAdminUrl(): string {
  const fallback = 'https://admin.elevateforhumanity.org';
  const env = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  if (!env) return fallback;

  try {
    const url = new URL(env);
    const host = url.hostname.toLowerCase();

    // Guard against exposing raw AWS ALB hostnames in user-facing links.
    if (host.endsWith('.elb.amazonaws.com')) {
      return fallback;
    }

    return `${url.protocol}//${url.host}`;
  } catch {
    return fallback;
  }
}
