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

const SINGLE_VAR_LIMIT = 3500;  // bytes — hard fail
const TOTAL_LIMIT      = 3800;  // bytes — hard fail (Lambda 4KB minus overhead)
const WARN_THRESHOLD   = 200;   // bytes — flag large individual vars

// Vars that are expected to be large or are build-time-only (not injected into functions)
// Netlify injects ~60 system vars into every build. We only want to audit
// vars that are USER-SET in Netlify site/team settings — not system vars.
// System var prefixes injected by Netlify's build infrastructure:
const SYSTEM_PREFIXES = [
  'npm_', 'NETLIFY', 'BUILD_', 'DEPLOY_', 'CONTEXT', 'BRANCH',
  'HEAD', 'COMMIT_REF', 'CACHED_COMMIT_REF', 'PULL_REQUEST',
  'REVIEW_ID', 'URL', 'REPOSITORY_URL', 'SITE_', 'INCOMING_HOOK',
  'LANG', 'LC_', 'HOME', 'USER', 'SHELL', 'TERM', 'COLORTERM',
  'LOGNAME', 'TMPDIR', 'XDG_', 'DBUS_', 'INVOCATION_ID',
  'JOURNAL_', 'SYSTEMD_', 'HOSTNAME', 'PWD', 'OLDPWD', 'SHLVL',
  'MANPATH', 'LS_COLORS', 'LESS', 'PAGER', 'EDITOR', 'VISUAL',
];

const KNOWN_LARGE = new Set([
  'NODE_OPTIONS', 'NODE_PATH', 'NODE_VERSION',
  'npm_config_cache', 'npm_package_json',
  'PATH', 'MANPATH', 'LS_COLORS',
  // Netlify build system vars
  'NETLIFY_IMAGES_CDN_DOMAIN',
]);

// Vars that should NOT be present in Netlify marketing functions
const RAILWAY_ONLY_PATTERNS = [
  /^OPENAI/,
  /^DID_API/,
  /^REMOTION/,
  /^OCR/,
  /^TESSERACT/,
  /^JOB_QUEUE/,
  /^REDIS_URL/,
  /^RAILWAY/,
  /^DATABASE_URL/,
  /^MIGRATION/,
  /^IRS_/,
  /^MEF_/,
  /^CRON_SECRET/,
  /^AUDIT_EXPORT/,
  /^SOCIAL_MEDIA/,
  /^ONBOARDING_/,
];

const env = process.env;
const entries = Object.entries(env)
  .filter(([key, val]) => {
    if (KNOWN_LARGE.has(key)) return false;
    // Skip Netlify system-injected build vars — these are not user-set secrets
    // and are not injected into Lambda functions at runtime.
    if (SYSTEM_PREFIXES.some(p => key.startsWith(p))) return false;
    // Skip other well-known system vars
    if (['PATH', 'HOME', 'USER', 'SHELL', 'TERM', 'LANG', 'PWD', 'SHLVL',
         'HOSTNAME', 'LOGNAME', 'TMPDIR', 'COLORTERM', 'OLDPWD',
         'NETLIFY', 'CI', 'CONTINUOUS_INTEGRATION', 'NEXT_TELEMETRY_DISABLED',
         'NEXT_PRIVATE_BUILD_WORKER_COUNT'].includes(key)) return false;
    return true;
  })
  .map(([key, val]) => ({ key, bytes: Buffer.byteLength(val ?? '', 'utf8') }))
  .sort((a, b) => b.bytes - a.bytes);

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

  if (RAILWAY_ONLY_PATTERNS.some(p => p.test(key))) {
    railwayLeaks.push(`  ⚠️  ${key} — Railway/backend-only, should not be in Netlify`);
  }
}

console.log('\n[env-size] Netlify function environment audit');
console.log(`[env-size] Total env vars checked: ${entries.length}`);
console.log(`[env-size] Total bytes: ${totalBytes} / ${TOTAL_LIMIT} limit\n`);

if (warnings.length) {
  console.log('[env-size] Large vars (>200 bytes):');
  warnings.forEach(w => console.log(w));
  console.log('');
}

if (railwayLeaks.length) {
  console.log('[env-size] Railway/backend vars detected in Netlify env:');
  railwayLeaks.forEach(r => console.log(r));
  console.log('  → Move these to Railway or Supabase app_secrets, not Netlify site settings.\n');
}

if (errors.length) {
  console.log('[env-size] ERRORS — vars exceeding single-var limit:');
  errors.forEach(e => console.log(e));
  console.log('');
}

if (totalBytes > TOTAL_LIMIT) {
  console.error(`[env-size] ❌ Total env size ${totalBytes}B exceeds ${TOTAL_LIMIT}B Lambda limit.`);
  console.error('[env-size] Remove Railway/backend-only vars from Netlify site settings.');
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log(`[env-size] ✅ Env size OK (${totalBytes}B / ${TOTAL_LIMIT}B)`);
}
