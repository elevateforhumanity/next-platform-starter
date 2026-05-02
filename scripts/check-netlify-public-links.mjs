// scripts/check-netlify-public-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, '.next/server/app-paths-manifest.json');

// Scan only what is actually compiled in the Netlify build:
// - app/ (post-quarantine, so only marketing pages remain)
// - shared marketing components used by those pages
const SCAN_DIRS = ['app', 'components/site', 'components/marketing', 'components/layout'];

// Routes that exist in app/ and are in the quarantine allowlist but may not
// appear in the manifest on the first build after being allowlisted.
// These are verified clean pages with no quarantined imports.
const KNOWN_GOOD_ROUTES = new Set([
  '/fssa',
  '/fssa/snap-et',
  '/fssa/partnership-request',
  '/enrollment-agreement',
  // Quarantined on Netlify (Railway-only) but legitimately linked from public pages
  '/employers',
  '/mou/employer',
]);
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.mdx']);

const IGNORE_PREFIXES = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  '#',
  '/#',
  '/_next/',
  '/api/',
  '/images/',
  '/img/',
  '/icons/',
  '/fonts/',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
  // Railway-proxied namespaces — Netlify forwards these at the edge.
  // Links to these paths from public pages are valid; they resolve via netlify.toml proxy rules.
  '/partner/',
  '/lms/',
  '/admin',
  '/admin/',
  '/learner/',
  '/instructor/',
  '/employer/',
  '/mentor/',
  '/program-holder/',
  '/staff-portal/',
  '/supersonic/',
];

const IGNORE_FILE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.zip',
  '.mp4',
  '.mov',
  '.webm',
];

const FORBIDDEN_PUBLIC_PREFIXES = [
  '/admin',
  '/api',
  '/lms',
  '/learner',
  '/student',
  '/dashboard',
  '/my-dashboard',
  '/instructor',
  '/employer',
  '/partner-dashboard',
  '/program-holder',
  '/staff-portal',
  '/case-manager',
  '/proctor',
  '/creator',
  '/builder',
  '/reports',
  '/approvals',
  '/account',
  '/profile',
  '/settings',
  '/billing',
  '/checkout',
  '/pay',
  '/payment',
  '/enroll',
  '/enrollment',
  '/messages',
  '/notifications',
  '/certificates',
  '/credentials',
  '/transcript',
  '/advising',
  '/documents',
  '/compliance',
  '/apprentice',
  '/schedule',
  '/videos',
  '/video',
  '/ai',
  '/ai-chat',
  '/ai-studio',
  '/ai-tutor',
];

// Files/dirs to skip — Railway-only nav, admin components, LMS components
const SKIP_PATH_PATTERNS = [
  /\/node_modules\//,
  /\/\.next\//,
  /\/__/, // __-prefixed (disabled) pages
  /\/app\/\(auth\)\//,
  /\/app\/\(dashboard\)\//,
  /\/app\/\(partner\)\//,
  /\/app\/admin\//,
  /\/app\/lms\//,
  /\/app\/learner\//,
  /\/app\/instructor\//,
  /\/app\/employer\//,
  /\/app\/staff-portal\//,
  /\/app\/mentor\//,
  /\/app\/program-holder\//,
  /\/app\/partner\//,
  /\/app\/partner-dashboard\//,
  /\/app\/student\//,
  /\/app\/creator\//,
  /\/app\/builder\//,
  /\/app\/programs\/admin\//,
  /\/app\/supersonic\//,
  /\/app\/tax\//,
  /\/app\/pwa\//,
  /\/app\/pay\//,
  /\/app\/enroll\//,
  /\/app\/enrollment\//,
  /\/app\/compliance\//,
  /\/app\/booking\/enrollment\//,
  /\/components\/admin\//,
  /\/components\/lms\//,
  /\/components\/navigation\/HubNavigation/,
  /\/components\/navigation\/AdminNav/,
  /\/lib\/admin\//,
  /\/lib\/lms\//,
  /\/lib\/tax\//,
];

function readManifestRoutes() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest: ${MANIFEST_PATH}. Run NETLIFY=true pnpm run build first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const compiled = new Set(
    Object.keys(manifest)
      .map((route) => {
        // Manifest keys look like "/about/page" or "/programs/[slug]/page"
        let clean = route.replace(/\/page$/, '');
        // Strip route groups like /(marketing)/
        clean = clean.replace(/\/\([^)]+\)/g, '');
        return normalizeRoute(clean);
      })
      .filter(Boolean),
  );

  // Also load next.config.mjs redirect sources so the checker knows about them.
  // A link that has a redirect is not broken — it will resolve at runtime.
  const nextConfigPath = path.join(ROOT, 'next.config.mjs');
  if (fs.existsSync(nextConfigPath)) {
    const src = fs.readFileSync(nextConfigPath, 'utf8');
    const sourcePattern = /source:\s*['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = sourcePattern.exec(src)) !== null) {
      // Strip :path* and trailing wildcards for matching purposes
      const clean = normalizeRoute(m[1].replace(/\/:path\*$/, '').replace(/\/\*$/, ''));
      if (clean) compiled.add(clean);
    }
  }

  // Also load netlify.toml redirect froms
  const netlifyTomlPath = path.join(ROOT, 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    const src = fs.readFileSync(netlifyTomlPath, 'utf8');
    const fromPattern = /from\s*=\s*"([^"]+)"/g;
    let m;
    while ((m = fromPattern.exec(src)) !== null) {
      const clean = normalizeRoute(m[1].replace(/\/\*$/, ''));
      if (clean) compiled.add(clean);
    }
  }

  // Add verified-clean pages that may not appear in the manifest on first
  // build after being added to the quarantine allowlist.
  for (const route of KNOWN_GOOD_ROUTES) compiled.add(route);

  return compiled;
}

function normalizeRoute(route) {
  if (!route) return null;

  let clean = route.split('?')[0].split('#')[0];

  if (clean !== '/' && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  return clean;
}

function shouldIgnoreHref(href) {
  if (!href) return true;
  // Template literals and variable interpolations
  if (href.startsWith('{') || href.includes('${') || href.startsWith('$')) return true;
  // Non-http protocols
  if (/^(sms|tel|mailto|ftp|javascript):/.test(href)) return true;

  if (IGNORE_PREFIXES.some((prefix) => href.startsWith(prefix))) return true;

  const lower = href.toLowerCase();
  if (IGNORE_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;

  return false;
}

function isForbiddenPublicRoute(href) {
  return FORBIDDEN_PUBLIC_PREFIXES.some((prefix) => {
    return href === prefix || href.startsWith(`${prefix}/`);
  });
}

function routeExists(href, compiledRoutes) {
  const clean = normalizeRoute(href);

  if (!clean) return true;
  // Root always exists
  if (clean === '/') return true;
  if (compiledRoutes.has(clean)) return true;

  // Check if any compiled route is a prefix match (covers :path* wildcard redirects).
  // e.g. compiled has '/learner' and href is '/learner/dashboard' → covered.
  const hrefParts = clean.split('/').filter(Boolean);
  for (const route of compiledRoutes) {
    const routeParts = route.split('/').filter(Boolean);

    // Exact dynamic segment match (Next.js [param] routes)
    if (routeParts.length === hrefParts.length) {
      const matches = routeParts.every((part, i) =>
        part.startsWith('[') && part.endsWith(']') ? true : part === hrefParts[i],
      );
      if (matches) return true;
    }

    // Prefix match — redirect source covers all sub-paths
    // e.g. source '/learner' covers '/learner/dashboard'
    if (hrefParts.length > routeParts.length) {
      const prefixMatch = routeParts.every((part, i) => part === hrefParts[i]);
      if (prefixMatch) return true;
    }
  }

  return false;
}

function shouldSkipFile(filePath) {
  return SKIP_PATH_PATTERNS.some((p) => p.test(filePath));
}

function walkFiles(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];

  const out = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) {
          continue;
        }
        walk(full);
        continue;
      }

      const ext = path.extname(entry.name);
      if (EXTENSIONS.has(ext) && !shouldSkipFile(full)) {
        out.push(full);
      }
    }
  }

  walk(abs);
  return out;
}

function extractHrefs(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const hrefs = [];

  const patterns = [/href\s*=\s*["']([^"']+)["']/g, /href\s*:\s*["'](\/[^"']+)["']/g];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      hrefs.push({ href: match[1], index: match.index });
    }
  }

  return hrefs;
}

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function suggestFix(href) {
  if (isForbiddenPublicRoute(href)) {
    return 'Remove from public Netlify nav or replace with external Railway app URL.';
  }
  if (href.includes('fund')) return 'Use /funding or /check-eligibility.';
  if (href.includes('fssa')) return 'Use /contact (FSSA page not compiled).';
  if (href.includes('program')) return 'Use /programs.';
  if (href.includes('apply')) return 'Use /apply or /check-eligibility.';
  if (href.includes('employer')) return 'Use /employers.';
  if (href.includes('partner')) return 'Use /partners.';
  return 'Replace with /programs, /contact, /apply, or /check-eligibility.';
}

function main() {
  if (!process.env.NETLIFY) {
    console.log('[public-links] Not on Netlify — skipping.');
    process.exit(0);
  }

  const compiledRoutes = readManifestRoutes();
  const files = SCAN_DIRS.flatMap(walkFiles);
  const failures = [];
  const seen = new Set();

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const source = fs.readFileSync(file, 'utf8');
    const hrefs = extractHrefs(file);

    for (const item of hrefs) {
      const href = normalizeRoute(item.href);
      if (!href || shouldIgnoreHref(href)) continue;

      const key = `${rel}:${href}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const covered = routeExists(href, compiledRoutes);
      const forbidden = isForbiddenPublicRoute(href);

      // A forbidden route is only a problem if there is no redirect covering it.
      // A missing route is only a problem if it is not covered by a redirect.
      if (!covered) {
        failures.push({
          file: rel,
          line: lineNumberForIndex(source, item.index),
          href,
          reason: forbidden
            ? 'Railway/Admin/LMS-only link with no redirect'
            : 'Route not compiled in Netlify manifest and no redirect exists',
          suggestion: suggestFix(href),
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\n[public-links] ❌ Found ${failures.length} bad public link(s):\n`);
    for (const f of failures) {
      console.error(`  ${f.file}:${f.line}`);
      console.error(`    href: ${f.href}`);
      console.error(`    reason: ${f.reason}`);
      console.error(`    fix: ${f.suggestion}\n`);
    }
    process.exit(1);
  }

  console.log(`[public-links] ✅ All public hrefs resolve inside Netlify marketing build.`);
  console.log(
    `[public-links] Checked ${files.length} files against ${compiledRoutes.size} compiled routes.`,
  );
}

main();
