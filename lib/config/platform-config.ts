/**
 * Platform configuration loader.
 *
 * Reads from `platform_settings` (the admin-editable key/value table) with
 * env var fallbacks for build-time and cold-start scenarios.
 *
 * Usage (server components / API routes):
 *   import { getPlatformConfig } from '@/lib/config/platform-config';
 *   const cfg = await getPlatformConfig();
 *   cfg.orgName   // "Elevate for Humanity"
 *   cfg.siteUrl   // "https://www.elevateforhumanity.org"
 *
 * Usage (client components — static values baked at build time):
 *   import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
 *   PLATFORM_DEFAULTS.orgName
 */

import { cache } from 'react';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { sanitizePlatformValue } from '@/lib/config/sanitize-platform-value';

// ── Build-time / env-var defaults ─────────────────────────────────────────────
// These are the fallback values used when platform_settings has no row for a key.
// Override via runtime environment variables or .env.local.

const ENV_DEFAULTS = {
  orgName: 'Elevate for Humanity',
  orgLegalName: 'Elevate for Humanity Career & Technical Institute',
  siteUrl: 'https://www.elevateforhumanity.org',
  supportEmail: 'support@elevateforhumanity.org',
  supportPhone: '(317) 314-3757',
  emailFromName: 'Elevate for Humanity',
  emailFromAddress: 'noreply@elevateforhumanity.org',
  certificateHolder: 'Elevate for Humanity',
  canonicalDomain: 'www.elevateforhumanity.org',
} as const;

export const PLATFORM_DEFAULTS = {
  orgName: sanitizePlatformValue(process.env.NEXT_PUBLIC_ORG_NAME, ENV_DEFAULTS.orgName),
  orgLegalName: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_ORG_LEGAL_NAME,
    ENV_DEFAULTS.orgLegalName,
  ),
  siteUrl: sanitizePlatformValue(process.env.NEXT_PUBLIC_SITE_URL, ENV_DEFAULTS.siteUrl),
  supportEmail: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    ENV_DEFAULTS.supportEmail,
  ),
  supportPhone: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_SUPPORT_PHONE,
    ENV_DEFAULTS.supportPhone,
  ),
  emailFromName: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_EMAIL_FROM_NAME,
    ENV_DEFAULTS.emailFromName,
  ),
  emailFromAddress: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS,
    ENV_DEFAULTS.emailFromAddress,
  ),
  certificateHolder: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_CERT_HOLDER,
    ENV_DEFAULTS.certificateHolder,
  ),
  canonicalDomain: sanitizePlatformValue(
    process.env.NEXT_PUBLIC_CANONICAL_DOMAIN,
    ENV_DEFAULTS.canonicalDomain,
  ),
} as const;

export type PlatformConfig = typeof PLATFORM_DEFAULTS;

// ── Server-side loader (cached per request) ───────────────────────────────────

/**
 * Returns platform config merged from platform_settings DB rows + env defaults.
 * DB values take priority over env vars.
 * Safe to call from any server component or API route — uses service-role client.
 */
export const getPlatformConfig = cache(async (): Promise<PlatformConfig> => {
  try {
    const db = await requireAdminClient();
    const { data: rows, error } = await db
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'site_name',
        'org_legal_name',
        'site_url',
        'support_email',
        'contact_phone',
        'email_from_name',
        'email_from_address',
        'certificate_holder',
        'canonical_domain',
      ]);

    if (error) {
      logger.warn('[getPlatformConfig] platform_settings query failed — using env defaults', error);
      return PLATFORM_DEFAULTS;
    }

    const s: Record<string, string> = Object.fromEntries(
      (rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]),
    );

    return {
      orgName: sanitizePlatformValue(s['site_name'], PLATFORM_DEFAULTS.orgName),
      orgLegalName: sanitizePlatformValue(s['org_legal_name'], PLATFORM_DEFAULTS.orgLegalName),
      siteUrl: sanitizePlatformValue(s['site_url'], PLATFORM_DEFAULTS.siteUrl),
      supportEmail: sanitizePlatformValue(s['support_email'], PLATFORM_DEFAULTS.supportEmail),
      supportPhone: sanitizePlatformValue(s['contact_phone'], PLATFORM_DEFAULTS.supportPhone),
      emailFromName: sanitizePlatformValue(s['email_from_name'], PLATFORM_DEFAULTS.emailFromName),
      emailFromAddress: sanitizePlatformValue(
        s['email_from_address'],
        PLATFORM_DEFAULTS.emailFromAddress,
      ),
      certificateHolder: sanitizePlatformValue(
        s['certificate_holder'],
        PLATFORM_DEFAULTS.certificateHolder,
      ),
      canonicalDomain: sanitizePlatformValue(
        s['canonical_domain'],
        PLATFORM_DEFAULTS.canonicalDomain,
      ),
    };
  } catch (err) {
    logger.warn('[getPlatformConfig] unexpected error — using env defaults', err);
    return PLATFORM_DEFAULTS;
  }
});
