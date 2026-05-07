/**
 * /api/admin/env-vars
 *
 * Read and write platform configuration values stored in `platform_settings`.
 *
 * SECURITY MODEL (explicit):
 * - Super-admin only (apiRequireAdmin enforces admin|super_admin|staff|org_admin).
 * - Values are stored PLAINTEXT in platform_settings. No encryption at rest
 *   beyond what Supabase/Postgres provides at the infrastructure level.
 *   Do not store credentials here that are not already in your .env.
 * - Secret values are masked on GET for keys matching SECRET_PATTERNS.
 *   Keys that do not match those patterns are returned in full — regex-based
 *   detection is convenience UX, not a security control.
 * - POST accepts only keys present in ALLOWED_KEYS. Arbitrary key writes are
 *   rejected to prevent namespace pollution and accidental overwrites.
 * - All writes are audit-logged (user_id, keys changed, timestamp).
 * - Payload capped at 50 entries per request.
 *
 * GET    /api/admin/env-vars          → all keys with masked secret values
 * POST   /api/admin/env-vars          → upsert entries (allowlisted keys only)
 * DELETE /api/admin/env-vars?key=X    → delete a key (allowlisted keys only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Secret masking ────────────────────────────────────────────────────────────

const SECRET_PATTERNS = [
  /key$/i,
  /secret$/i,
  /token$/i,
  /password$/i,
  /pass$/i,
  /api_key/i,
  /private/i,
  /auth/i,
  /sid$/i,
  /dsn$/i,
  /salt$/i,
  /encryption/i,
  /webhook/i,
];

function isSecret(key: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(key));
}

function maskValue(key: string, value: string): string {
  if (!isSecret(key)) return value;
  if (value.length <= 8) return '••••••••';
  return '••••••••' + value.slice(-4);
}

// ── Allowlist ─────────────────────────────────────────────────────────────────

const ALLOWED_KEYS = new Set([
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_URL',
  'SUPABASE_PROJECT_REF',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_PROVIDER',
  'SENDGRID_API_KEY',
  'SENDGRID_KEY',
  'SENDGRID_FROM',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'MAIL_FROM',
  'MAIL_TO_ADMIN',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_RESTRICTED_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_WEBHOOK_SECRET_BARBER',
  'STRIPE_WEBHOOK_SECRET_BOOTH',
  'STRIPE_WEBHOOK_SECRET_CAREER_COURSES',
  'STRIPE_WEBHOOK_SECRET_DONATIONS',
  'STRIPE_WEBHOOK_SECRET_LICENSE',
  'STRIPE_WEBHOOK_SECRET_LICENSES',
  'STRIPE_WEBHOOK_SECRET_STORE',
  'STRIPE_WEBHOOK_SECRET_TAX',
  'STRIPE_TESTING_WEBHOOK_SECRET',
  'STRIPE_IDENTITY_WEBHOOK_SECRET',
  'STRIPE_PRICES_JSON',
  'STRIPE_PRICE_CR_ENTERPRISE',
  'STRIPE_PRICE_CR_GUIDE',
  'STRIPE_REFRESH_URL',
  'STRIPE_RETURN_URL',
  'OPENAI_API_KEY',
  'AI_PROVIDER',
  'AI_IMAGE_PROVIDER',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_DEPLOYMENT',
  'AZURE_OPENAI_API_VERSION',
  'AZURE_DALLE_DEPLOYMENT',
  'GEMINI_API_KEY',
  'ELEVENLABS_API_KEY',
  'NEXT_PUBLIC_ELEVENLABS_API_KEY',
  'STABILITY_API_KEY',
  'STABILITY_API_HOST',
  'DID_API_KEY',
  'SYNTHESIA_API_KEY',
  'RUNWAY_API_KEY',
  'SUNO_API_KEY',
  'PEXELS_API_KEY',
  'PIXABAY_API_KEY',
  'UNSPLASH_ACCESS_KEY',
  'DURABLE_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_CLOUD_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'GOOGLE_TAG_MANAGER_ID',
  'GOOGLE_SITE_VERIFICATION',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'GOOGLE_OAUTH_ENABLED',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE',
  'TWILIO_PHONE_NUMBER',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_PUBLIC_URL',
  'CLOUDFLARE_STREAM_API_TOKEN',
  'R2_ACCESS_KEY',
  'R2_SECRET_KEY',
  'R2_BUCKET',
  'R2_ENDPOINT',
  'NEXT_PUBLIC_R2_URL',
  'NETLIFY_AUTH_TOKEN',
  'NETLIFY_SITE_ID',
  'NETLIFY_TOKEN',
  'NETLIFY_BUILD_HOOK',
  'NETLIFY_BUILD_HOOK_URL',
  'GITHUB_TOKEN',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'REDIS_URL',
  'FACEBOOK_ACCESS_TOKEN',
  'FACEBOOK_CLIENT_ID',
  'FACEBOOK_CLIENT_SECRET',
  'FACEBOOK_PAGE_ID',
  'FACEBOOK_PAGE_1_TOKEN',
  'FACEBOOK_PAGE_2_TOKEN',
  'INSTAGRAM_ACCESS_TOKEN',
  'INSTAGRAM_BUSINESS_ACCOUNT_ID',
  'LINKEDIN_ACCESS_TOKEN',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'LINKEDIN_COMPANY_ID',
  'LINKEDIN_ORGANIZATION_ID',
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
  'TWITTER_BEARER_TOKEN',
  'YOUTUBE_API_KEY',
  'YOUTUBE_ACCESS_TOKEN',
  'YOUTUBE_CHANNEL_ID',
  'HUBSPOT_API_KEY',
  'HUBSPOT_PORTAL_ID',
  'HUBSPOT_FORM_GUID',
  'HUBSPOT_PRIVATE_APP_TOKEN',
  'SALESFORCE_CLIENT_ID',
  'SALESFORCE_CLIENT_SECRET',
  'SALESFORCE_INSTANCE_URL',
  'SALESFORCE_LOGIN_URL',
  'SALESFORCE_USERNAME',
  'SALESFORCE_PASSWORD',
  'SALESFORCE_SECURITY_TOKEN',
  'SALESFORCE_API_KEY',
  'ZOOM_ACCOUNT_ID',
  'ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',
  'ZOOM_ACCESS_TOKEN',
  'ZOOM_USER_ID',
  'MAILCHIMP_API_KEY',
  'MAILCHIMP_AUDIENCE_ID',
  'MAILCHIMP_SERVER_PREFIX',
  'ZAPIER_WEBHOOK_URL',
  'TEAMS_WEBHOOK_URL',
  'PARTNER_WEBHOOK_SECRET',
  'JOTFORM_API_KEY',
  'JOTFORM_FORM_ID',
  'JOTFORM_WEBHOOK_SECRET',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SLACK_SECURITY_WEBHOOK',
  'SLACK_ALERT_WEBHOOK',
  'SLACK_WEBHOOK_URL',
  'SEZZLE_PUBLIC_KEY',
  'SEZZLE_PRIVATE_KEY',
  'SEZZLE_ENVIRONMENT',
  'SEZZLE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SEZZLE_PUBLIC_KEY',
  'NEXT_PUBLIC_SEZZLE_MERCHANT_ID',
  'AFFIRM_PUBLIC_KEY',
  'AFFIRM_PRIVATE_KEY',
  'AFFIRM_PRIVATE_API_KEY',
  'AFFIRM_API_URL',
  'AFFIRM_BASE_URL',
  'AFFIRM_ENVIRONMENT',
  'AFFIRM_WEBHOOK_SECRET',
  'WIOA_REPORTING_API_KEY',
  'WIOA_REPORTING_URL',
  'INDIANA_DWD_API_KEY',
  'INDIANA_DWD_API_URL',
  'JRI_API_KEY',
  'JRI_API_BASE_URL',
  'JRI_ORGANIZATION_ID',
  'GRANTS_GOV_API_KEY',
  'SAM_GOV_API_KEY',
  'SSA_API_KEY',
  'NHA_ACCOUNT_NUMBER',
  'NHA_PORTAL_URL',
  'CREDLY_API_KEY',
  'CREDLY_ORGANIZATION_ID',
  'CERTIPORT_API_KEY',
  'CERTIPORT_API_SECRET',
  'CERTIPORT_API_BASE_URL',
  'CERTIPORT_ORGANIZATION_ID',
  'CAREERSAFE_API_KEY',
  'CAREERSAFE_API_SECRET',
  'CAREERSAFE_API_BASE_URL',
  'CAREERSAFE_ORGANIZATION_ID',
  'MILADY_API_KEY',
  'MILADY_API_SECRET',
  'MILADY_API_URL',
  'MILADY_API_BASE_URL',
  'MILADY_ORGANIZATION_ID',
  'MILADY_ORG_ID',
  'MILADY_SCHOOL_ID',
  'MILADY_STRIPE_ACCOUNT_ID',
  'MILADY_WEBHOOK_SECRET',
  'NDS_API_KEY',
  'NDS_API_SECRET',
  'NDS_API_BASE_URL',
  'NDS_ORGANIZATION_ID',
  'NRF_API_KEY',
  'NRF_API_SECRET',
  'NRF_API_BASE_URL',
  'NRF_ORGANIZATION_ID',
  'HSI_API_KEY',
  'HSI_API_SECRET',
  'HSI_API_BASE_URL',
  'HSI_ORGANIZATION_ID',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'NEXTAUTH_SECRET',
  'WORKOS_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_ALERT_EMAIL',
  'ALERT_EMAIL',
  'ALERT_EMAIL_TO',
  'ADMIN_API_KEY',
  'ADMIN_API_SECRET',
  'ADMIN_TEST_EMAIL_TOKEN',
  'ENABLE_ADMIN_DEVTOOLS',
  'ENABLE_AUDIT_LOGGING',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CDN_DOMAIN',
  'NEXT_PUBLIC_CALENDLY_URL',
  'NEXT_PUBLIC_CALENDLY_30MIN',
  'CALENDLY_WEBHOOK_SECRET',
  'ZENDESK_API_TOKEN',
  'ZENDESK_EMAIL',
  'ZENDESK_SUBDOMAIN',
  'MAPBOX_ACCESS_TOKEN',
  'SCORM_APP_ID',
  'SCORM_SECRET_KEY',
  'XAPI_USERNAME',
  'XAPI_PASSWORD',
  'NEXT_PUBLIC_XAPI_ENDPOINT',
]);

// ── Audit helper ──────────────────────────────────────────────────────────────

async function auditWrite(userId: string, action: 'upsert' | 'delete', keys: string[]) {
  try {
    const db = await requireAdminClient();
    await db.from('audit_logs').insert({
      user_id: userId,
      action: `env_vars.${action}`,
      resource_type: 'platform_settings',
      resource_id: keys.join(','),
      metadata: { keys, count: keys.length },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[env-vars] audit write failed', err);
  }
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('platform_settings')
    .select('key, value, updated_at')
    .order('key');

  if (error) return safeDbError(error, 'Failed to load settings');

  const rows = (data ?? []).map((row) => ({
    key: row.key,
    value: maskValue(row.key, row.value ?? ''),
    is_secret: isSecret(row.key),
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ settings: rows });
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: { entries: { key: string; value: string }[] };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return safeError('entries array required', 400);
  }

  if (body.entries.length > 50) {
    return safeError('Maximum 50 entries per request', 400);
  }

  for (const entry of body.entries) {
    if (!entry.key?.trim()) return safeError('Each entry must have a key', 400);
    if (!ALLOWED_KEYS.has(entry.key.trim())) {
      return safeError(`Key not in allowlist: ${entry.key}`, 400);
    }
    if (entry.value === undefined || entry.value === null) {
      return safeError(`Missing value for key: ${entry.key}`, 400);
    }
  }

  const db = await requireAdminClient();
  const rows = body.entries.map((e) => ({
    key: e.key.trim(),
    value: e.value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db.from('platform_settings').upsert(rows, { onConflict: 'key' });

  if (error) return safeDbError(error, 'Failed to save settings');

  await auditWrite(
    auth.user.id,
    'upsert',
    rows.map((r) => r.key),
  );

  return NextResponse.json({ saved: rows.length });
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const key = new URL(req.url).searchParams.get('key');
  if (!key) return safeError('key query param required', 400);

  if (!ALLOWED_KEYS.has(key)) {
    return safeError(`Key not in allowlist: ${key}`, 400);
  }

  const db = await requireAdminClient();
  const { error } = await db.from('platform_settings').delete().eq('key', key);

  if (error) return safeDbError(error, 'Failed to delete setting');

  await auditWrite(auth.user.id, 'delete', [key]);

  return NextResponse.json({ deleted: key });
}
