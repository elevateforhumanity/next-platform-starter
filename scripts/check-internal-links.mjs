#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IS_NETLIFY = process.env.NETLIFY === 'true';

const canonicalConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'lib/routes/canonical-routes.json'), 'utf8'),
);

const CANONICAL_ALIASES = new Map(
  (canonicalConfig.legacyAliases || []).map((alias) => [normalizePath(alias.source), alias.destination]),
);
const RAILWAY_ONLY_PREFIXES = canonicalConfig.railwayOnlyPrefixes || [];
const EXTERNAL_OR_APP_HOSTED_ALLOWLIST = new Set(canonicalConfig.externalOrAppHostedAllowlist || []);

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
];

const IGNORE_EXTENSIONS = [
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

const SCAN_ROOTS = ['app', 'components', 'lib', 'content', 'data'];
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.mdx']);

const PUBLIC_COMPONENT_PREFIXES = [
  'components/site/',
  'components/marketing/',
  'components/layout/',
  'components/programs/',
  'components/home/',
];

const PUBLIC_LIB_PREFIXES = ['lib/routes/', 'lib/pathways/'];

function loadNetlifyAllowedTopLevel() {
  const scriptPath = path.join(ROOT, 'scripts/netlify-quarantine-railway-routes.mjs');
  if (!fs.existsSync(scriptPath)) return null;
  const script = fs.readFileSync(scriptPath, 'utf8');
  const match = script.match(/const ALLOWED_TOP_LEVEL\s*=\s*new Set\(\[([\s\S]*?)\]\)/m);
  if (!match) return null;
  return new Set(
    [...match[1].matchAll(/'([^']+)'/g)]
      .map((m) => m[1])
      .filter((v) => !['components', 'actions', 'data'].includes(v)),
  );
}

const NETLIFY_ALLOWED_TOP_LEVEL = loadNetlifyAllowedTopLevel();
function loadNetlifyForbiddenSubpaths() {
  const scriptPath = path.join(ROOT, 'scripts/netlify-quarantine-railway-routes.mjs');
  if (!fs.existsSync(scriptPath)) return new Set();
  const script = fs.readFileSync(scriptPath, 'utf8');
  const match = script.match(/const FORBIDDEN_SUBPATHS\s*=\s*new Set\(\[([\s\S]*?)\]\)/m);
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}
const NETLIFY_FORBIDDEN_SUBPATHS = loadNetlifyForbiddenSubpaths();

const MARKETING_APP_EXCLUDE_SEGMENTS = new Set(
  RAILWAY_ONLY_PREFIXES.map((prefix) => prefix.replace(/^\//, '').split('/')[0]).filter(Boolean),
);

function normalizePath(input) {
  if (!input || typeof input !== 'string') return null;
  const stripped = input.split('?')[0].split('#')[0].trim();
  if (!stripped.startsWith('/')) return null;
  if (stripped !== '/' && stripped.endsWith('/')) return stripped.slice(0, -1);
  return stripped;
}

function shouldIgnoreHref(rawHref) {
  if (!rawHref || typeof rawHref !== 'string') return true;
  if (rawHref.includes('${') || rawHref.startsWith('{') || rawHref.includes('{{')) return true;
  if (/^(sms|mailto|tel|ftp|javascript):/i.test(rawHref)) return true;
  if (rawHref.includes('(') || rawHref.includes(')')) return true;
  if (IGNORE_PREFIXES.some((prefix) => rawHref.startsWith(prefix))) return true;
  const lower = rawHref.toLowerCase();
  if (IGNORE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  return false;
}

function parseRouteFromManifestKey(key) {
  return normalizePath(key.replace(/\/page$/, '').replace(/\/\([^)]+\)/g, '')) || '/';
}

function loadCompiledRoutes() {
  const manifestPath = path.join(ROOT, '.next/server/app-paths-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return new Set(Object.keys(manifest).map(parseRouteFromManifestKey).filter(Boolean));
  }
  return collectAppRoutesFallback();
}

function collectAppRoutesFallback() {
  const routes = new Set(['/']);
  const appRoot = path.join(ROOT, 'app');
  if (!fs.existsSync(appRoot)) return routes;

  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
        walk(full, `${prefix}${segment}`);
      } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        routes.add(prefix || '/');
      }
    }
  }

  walk(appRoot, '');
  return routes;
}

function routeMatchesDynamic(routePattern, candidate) {
  const patternParts = routePattern.split('/').filter(Boolean);
  const candidateParts = candidate.split('/').filter(Boolean);
  if (patternParts.length !== candidateParts.length) return false;
  return patternParts.every((segment, idx) => {
    if (/^\[\[?\.\.\..+\]?\]$/.test(segment)) return true;
    if (/^\[.+\]$/.test(segment)) return true;
    return segment === candidateParts[idx];
  });
}

function routeExists(href, compiledRoutes, aliasPrefixes) {
  const clean = normalizePath(href);
  if (!clean) return true;
  if (clean === '/') return true;
  if (compiledRoutes.has(clean)) return true;
  for (const route of compiledRoutes) {
    if (route.includes('[') && routeMatchesDynamic(route, clean)) return true;
  }
  for (const aliasPrefix of aliasPrefixes) {
    if (clean === aliasPrefix || clean.startsWith(`${aliasPrefix}/`)) return true;
  }
  return false;
}

function readRedirectSourcesFromConfigs() {
  const sources = new Set([...CANONICAL_ALIASES.keys()]);

  const nextConfigPath = path.join(ROOT, 'next.config.mjs');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    const pattern = /source:\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const normalized = normalizePath(
        match[1].replace(/\/:path\*$/, '').replace(/\/\*$/, '').replace(/\/:[^/]+/g, '/param'),
      );
      if (normalized) sources.add(normalized);
    }
  }

  const netlifyPath = path.join(ROOT, 'netlify.toml');
  if (fs.existsSync(netlifyPath)) {
    const content = fs.readFileSync(netlifyPath, 'utf8');
    const pattern = /from\s*=\s*"([^"]+)"/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const normalized = normalizePath(match[1].replace(/\/\*$/, ''));
      if (normalized) sources.add(normalized);
    }
  }

  return sources;
}

function isRailwayOnlyRoute(href) {
  return RAILWAY_ONLY_PREFIXES.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));
}

function isMarketingFile(relFilePath) {
  if (PUBLIC_COMPONENT_PREFIXES.some((prefix) => relFilePath.startsWith(prefix))) return true;
  if (relFilePath.startsWith('content/')) return true;
  if (relFilePath.startsWith('data/')) return true;
  if (!relFilePath.startsWith('app/')) return false;
  const rawSegments = relFilePath.replace(/^app\//, '').split('/');
  const segments = rawSegments.filter((seg) => seg && !seg.startsWith('(') && !seg.startsWith('_'));
  if (segments.some((seg) => MARKETING_APP_EXCLUDE_SEGMENTS.has(seg))) return false;
  const normalizedPath = segments
    .filter((seg) => !/^page\.(tsx|ts|jsx|js)$/.test(seg))
    .join('/');
  if (
    normalizedPath.includes('/enrollment-success') ||
    normalizedPath.includes('/payment-setup') ||
    normalizedPath.includes('/programs/admin/')
  ) {
    return false;
  }
  if (
    normalizedPath &&
    [...NETLIFY_FORBIDDEN_SUBPATHS].some(
      (forbidden) => normalizedPath === forbidden || normalizedPath.startsWith(`${forbidden}/`),
    )
  ) {
    return false;
  }
  const firstRouteSegment = segments.find((seg) => seg && !seg.startsWith('(') && !seg.startsWith('_'));
  if (!firstRouteSegment) return true;
  if (MARKETING_APP_EXCLUDE_SEGMENTS.has(firstRouteSegment)) return false;
  if (NETLIFY_ALLOWED_TOP_LEVEL) return NETLIFY_ALLOWED_TOP_LEVEL.has(firstRouteSegment);
  return true;
}

function shouldScanFile(relFilePath) {
  if (relFilePath.startsWith('content/') || relFilePath.startsWith('data/')) return true;

  if (relFilePath.startsWith('app/')) {
    return isMarketingFile(relFilePath);
  }

  if (relFilePath.startsWith('components/')) {
    return PUBLIC_COMPONENT_PREFIXES.some((prefix) => relFilePath.startsWith(prefix));
  }

  if (relFilePath.startsWith('lib/')) {
    return PUBLIC_LIB_PREFIXES.some((prefix) => relFilePath.startsWith(prefix));
  }

  return false;
}

function walkFiles(dir) {
  const absRoot = path.join(ROOT, dir);
  const files = [];
  if (!fs.existsSync(absRoot)) return files;

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(full);
      }
    }
  }

  walk(absRoot);
  return files;
}

function extractInternalHrefs(source) {
  const hrefs = [];
  const patterns = [
    /href\s*=\s*["'`]([^"'`]+)["'`]/g,
    /href\s*:\s*["'`]([^"'`]+)["'`]/g,
    /router\.(?:push|replace)\(\s*["'`]([^"'`]+)["'`]/g,
    /redirect\(\s*["'`]([^"'`]+)["'`]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      hrefs.push({ href: match[1], index: match.index });
    }
  }

  return hrefs;
}

function lineNumberAtIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

function main() {
  const compiledRoutes = loadCompiledRoutes();
  const redirectSources = readRedirectSourcesFromConfigs();
  const aliasPrefixes = new Set(redirectSources);

  const failures = [];
  const seen = new Set();
  const files = SCAN_ROOTS.flatMap(walkFiles);

  for (const file of files) {
    const relFile = path.relative(ROOT, file);
    if (!shouldScanFile(relFile)) continue;
    if (IS_NETLIFY && !isMarketingFile(relFile)) continue;

    const source = fs.readFileSync(file, 'utf8');
    const hrefs = extractInternalHrefs(source);

    for (const item of hrefs) {
      const normalizedHref = normalizePath(item.href);
      if (!normalizedHref || shouldIgnoreHref(item.href)) continue;

      const key = `${relFile}:${normalizedHref}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (EXTERNAL_OR_APP_HOSTED_ALLOWLIST.has(normalizedHref)) continue;

      const railwayOnly = isRailwayOnlyRoute(normalizedHref);
      if (IS_NETLIFY && railwayOnly) {
        failures.push({
          file: relFile,
          line: lineNumberAtIndex(source, item.index),
          href: normalizedHref,
          reason: 'Netlify marketing links cannot target Railway-only routes',
          suggestion: CANONICAL_ALIASES.get(normalizedHref) || 'Use a public canonical marketing route',
        });
        continue;
      }

      if (!routeExists(normalizedHref, compiledRoutes, aliasPrefixes)) {
        failures.push({
          file: relFile,
          line: lineNumberAtIndex(source, item.index),
          href: normalizedHref,
          reason: 'Internal href not found in compiled routes or redirect aliases',
          suggestion: CANONICAL_ALIASES.get(normalizedHref) || null,
        });
      }
    }
  }

  if (!failures.length) {
    const mode = IS_NETLIFY ? 'netlify' : process.env.RAILWAY === 'true' ? 'railway' : 'default';
    console.log(
      `✅ Internal link check passed (${mode}) — scanned ${files.length} files, ${compiledRoutes.size} routes.`,
    );
    process.exit(0);
  }

  console.error(`❌ Internal link check failed: ${failures.length} issue(s)\n`);
  for (const failure of failures) {
    console.error(`${failure.file}:${failure.line}`);
    console.error(`  href: ${failure.href}`);
    console.error(`  reason: ${failure.reason}`);
    if (failure.suggestion) {
      console.error(`  suggested: ${failure.suggestion}`);
    }
    console.error('');
  }

  process.exit(1);
}

main();
