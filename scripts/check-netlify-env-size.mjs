/**
 * check-netlify-env-size.mjs
 *
 * AWS Lambda injects ALL Netlify site env vars into every function.
 * The hard limit is 4 KB total. This script audits the current process
 * environment, reports each var's byte length, and fails if any single
 * value exceeds 3500 bytes or the total exceeds 3800 bytes.
 *
 * Run before build so the deploy fails fast with a clear diagnosis
 * rather than a cryptic Lambda upload error.
 *
 * Usage:
 *   node scripts/check-netlify-env-size.mjs
 */

const SINGLE_VAR_LIMIT = 3500; // bytes — hard fail
const TOTAL_LIMIT = 3800; // bytes — hard fail (Lambda 4KB minus overhead)
const WARN_THRESHOLD = 200; // bytes — flag large individual vars

// Vars that are expected to be large or are build-time-only (not injected into functions)
// Netlify injects ~60 system vars into every build. We only want to audit
// vars that are USER-SET in Netlify site/team settings — not system vars.
// System var prefixes injected by Netlify's build infrastructure:
const SYSTEM_PREFIXES = [
  'npm_',
  'NETLIFY',
  'BUILD_',
  'DEPLOY_',
  'CONTEXT',
  'BRANCH',
  'HEAD',
  'COMMIT_REF',
  'CACHED_COMMIT_REF',
  'PULL_REQUEST',
  'REVIEW_ID',
  'URL',
  'REPOSITORY_URL',
  'SITE_',
  'INCOMING_HOOK',
  'LANG',
  'LC_',
  'HOME',
  'USER',
  'SHELL',
  'TERM',
  'COLORTERM',
  'LOGNAME',
  'TMPDIR',
  'XDG_',
  'DBUS_',
  'INVOCATION_ID',
  'JOURNAL_',
  'SYSTEMD_',
  'HOSTNAME',
  'PWD',
  'OLDPWD',
  'SHLVL',
  'MANPATH',
  'LS_COLORS',
  'LESS',
  'PAGER',
  'EDITOR',
  'VISUAL',
];

const KNOWN_LARGE = new Set([
  'NODE_OPTIONS',
  'NODE_PATH',
  'NODE_VERSION',
  'npm_config_cache',
  'npm_package_json',
  'PATH',
  'MANPATH',
  'LS_COLORS',
  // Netlify build system vars
  'NETLIFY_IMAGES_CDN_DOMAIN',
]);

// Vars that should NOT be present in Netlify — Railway/backend-internal only.
// OPENAI_API_KEY and DID_API_KEY are intentionally present in Netlify:
//   - OPENAI_API_KEY: used by /api/ai-chat, /api/ai-tutor, /api/ai-tutor-basic,
//     /api/recaps/generate, /api/career-counseling/chat, and other Netlify API routes.
//   - DID_API_KEY: used by /api/ai-studio/generate-avatar (Netlify API route).
//   - RAILWAY_URL: used by netlify/edge-functions/api-proxy.ts to forward requests.
// Do NOT add these back to RAILWAY_ONLY_PATTERNS.
const RAILWAY_ONLY_PATTERNS = [
  /^REMOTION/,
  /^OCR/,
  /^TESSERACT/,
  /^JOB_QUEUE/,
  /^REDIS_URL/,
  /^RAILWAY_TOKEN$/,   // Railway-internal auth token — never needed in Netlify
  /^DATABASE_URL/,
  /^MIGRATION/,
  /^IRS_/,
  /^MEF_/,
  /^CRON_SECRET/,
  /^AUDIT_EXPORT/,
  /^SOCIAL_MEDIA/,
  /^ONBOARDING_/,
];

// Netlify Lambda functions only receive vars explicitly set in Netlify
// site/team settings. Build-time system vars (PATH, HOME, NETLIFY_*,
// BUILD_*, npm_*, FEATURE_FLAGS injected by build plugins, etc.) are
// NOT injected into Lambda at runtime.
//
// Strategy: fetch the actual site+team env from the Netlify API using
// credentials that must be set in Netlify site settings.

const NETLIFY_SITE_ID = '0a9378d2-a1d1-4062-9e9a-7be3105044df';
const NETLIFY_TEAM_ID = '6963287cefd141326e894542';

async function getUserSetEnvEntries() {
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_TOKEN;

  if (token) {
    try {
      // Fetch site-level env
      const siteRes = await fetch(
        `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/env?context_name=all&source=ui`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Fetch team-level env
      const teamRes = await fetch(
        `https://api.netlify.com/api/v1/accounts/${NETLIFY_TEAM_ID}/env?context_name=all&source=ui`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (siteRes.ok && teamRes.ok) {
        const siteVars = await siteRes.json();
        const teamVars = await teamRes.json();
        const all = [
          ...(Array.isArray(siteVars) ? siteVars : []),
          ...(Array.isArray(teamVars) ? teamVars : []),
        ];
        // Deduplicate (site overrides team)
        const seen = new Set();
        const deduped = all.filter((v) => {
          if (seen.has(v.key)) return false;
          seen.add(v.key);
          return true;
        });
        console.log(
          `[env-size] Using Netlify API — ${deduped.length} user-set vars (site + team).`,
        );
        return deduped
          .map((v) => ({
            key: v.key,
            bytes: Buffer.byteLength(v.values?.[0]?.value ?? '', 'utf8'),
          }))
          .sort((a, b) => b.bytes - a.bytes);
      }
    } catch (e) {
      console.log('[env-size] Netlify API error:', e.message, '— falling back to process.env');
    }
  }

  // Fallback: filter process.env to exclude known build-system vars.
  // FEATURE_FLAGS and similar are injected by Netlify's build system and
  // are NOT passed to Lambda functions at runtime.
  console.log(
    '[env-size] No NETLIFY_AUTH_TOKEN — filtering process.env (build-system vars excluded).',
  );
  const SKIP = new Set([
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'TERM',
    'LANG',
    'PWD',
    'SHLVL',
    'HOSTNAME',
    'LOGNAME',
    'TMPDIR',
    'COLORTERM',
    'OLDPWD',
    'CI',
    'CONTINUOUS_INTEGRATION',
    'NETLIFY',
    'NEXT_TELEMETRY_DISABLED',
    'NEXT_PRIVATE_BUILD_WORKER_COUNT',
    'NEXT_PRIVATE_WORKERS_PER_JOB',
    'FEATURE_FLAGS', // Netlify build plugin — not a Lambda secret
    'SECRETS_SCAN_ENABLED',
    'SECRETS_SCAN_OMIT_KEYS',
    'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD',
    'PUPPETEER_SKIP_DOWNLOAD',
    'ENABLE_ADMIN_DEVTOOLS',
    'NHA_ACCOUNT_NUMBER',
    'NHA_PORTAL_URL',
    'NETLIFY_USE_PNPM',
    'SENTRY_SKIP_AUTO_INSTRUMENTATION',
  ]);
  return Object.entries(process.env)
    .filter(([key]) => {
      if (KNOWN_LARGE.has(key)) return false;
      if (SYSTEM_PREFIXES.some((p) => key.startsWith(p))) return false;
      return !SKIP.has(key);
    })
    .map(([key, val]) => ({ key, bytes: Buffer.byteLength(val ?? '', 'utf8') }))
    .sort((a, b) => b.bytes - a.bytes);
}

const entries = await getUserSetEnvEntries();

let totalBytes = 0;
let hasError = false;
const warnings = [];
const errors = [];
const railwayLeaks = [];

for (const { key, bytes } of entries) {
  totalBytes += bytes;

  if (bytes > SINGLE_VAR_LIMIT) {
    errors.push(`  ❌ ${key}: ${bytes} bytes (exceeds ${SINGLE_VAR_LIMIT}B single-var limit)`);
    hasError = true;
  } else if (bytes > WARN_THRESHOLD) {
    warnings.push(`  ⚠️  ${key}: ${bytes} bytes`);
  }

  if (RAILWAY_ONLY_PATTERNS.some((p) => p.test(key))) {
    railwayLeaks.push(`  ⚠️  ${key} — Railway/backend-only, should not be in Netlify`);
  }
}

console.log('\n[env-size] Netlify function environment audit');
console.log(`[env-size] Total env vars checked: ${entries.length}`);
console.log(`[env-size] Total bytes: ${totalBytes} / ${TOTAL_LIMIT} limit\n`);

if (warnings.length) {
  console.log('[env-size] Large vars (>200 bytes):');
  warnings.forEach((w) => console.log(w));
  console.log('');
}

if (railwayLeaks.length) {
  console.log('[env-size] Railway/backend vars detected in Netlify env:');
  railwayLeaks.forEach((r) => console.log(r));
  console.log('  → Move these to Railway or Supabase app_secrets, not Netlify site settings.\n');
}

if (errors.length) {
  console.log('[env-size] ERRORS — vars exceeding single-var limit:');
  errors.forEach((e) => console.log(e));
  console.log('');
}

if (totalBytes > TOTAL_LIMIT) {
  console.error(
    `[env-size] ❌ Total env size ${totalBytes}B exceeds ${TOTAL_LIMIT}B Lambda limit.`,
  );
  console.error('[env-size] Remove Railway/backend-only vars from Netlify site settings.');
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log(`[env-size] ✅ Env size OK (${totalBytes}B / ${TOTAL_LIMIT}B)`);
}
