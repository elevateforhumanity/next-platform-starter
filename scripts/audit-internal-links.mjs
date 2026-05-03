#!/usr/bin/env node
/**
 * Audit internal hrefs across app/ and component directories.
 * Reports links that don't resolve to a compiled route, redirect, or known external.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ── Load compiled routes ──────────────────────────────────────────────────────
const manifestPath = path.join(root, '.next/server/app-paths-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('No manifest found — run pnpm next build first');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const compiled = new Set(
  Object.keys(manifest).map((k) => k.replace(/\/page$/, '').replace(/\([^)]*\)\//g, '') || '/'),
);

// ── Load redirect sources from next.config.mjs ────────────────────────────────
const nextCfg = fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');
const redirectSources = new Set();
const srcPattern = /source:\s*['"]([/][^'"]+)['"]/g;
let m;
while ((m = srcPattern.exec(nextCfg)) !== null) {
  redirectSources.add(m[1].replace(/\/:path\*$/, '').replace(/\/:[^/]+/g, '/:param'));
}


const toml = '';
const tomlFrom = /from\s*=\s*"([/][^"]+)"/g;
while ((m = tomlFrom.exec(toml)) !== null) {
  redirectSources.add(m[1].replace(/\/\*$/, '').replace(/\/:[^/]+/g, '/:param'));
}

function routeExists(href) {
  const base = href.split('?')[0].split('#')[0];
  if (compiled.has(base)) return true;
  // Dynamic segment prefix match
  for (const r of compiled) {
    if (r.includes('[')) {
      const prefix = r.replace(/\/\[[^\]]+\].*$/, '');
      if (prefix && base.startsWith(prefix + '/')) return true;
    }
  }
  // Redirect coverage
  for (const src of redirectSources) {
    if (base === src || base.startsWith(src + '/')) return true;
  }
  return false;
}

const SKIP_PREFIXES = [
  '/api/',
  '/_next',
  '/images/',
  '/img/',
  '/icons/',
  '/fonts/',
  '/favicon',
  '/robots',
  '/sitemap',
  '/public/',
  '/static/',
  // Static file extensions served from public/
];

// Static file extensions — not routes
const STATIC_EXT =
  /\.(png|jpg|jpeg|gif|svg|ico|webp|pdf|mp4|mp3|woff|woff2|ttf|eot|css|js|json|xml|txt)$/i;

const hrefRe = /href=["'`](\/[a-z0-9][^"'`\s>]*)/gi;
const pushRe = /router\.(?:push|replace)\(["'`](\/[a-z0-9][^"'`\s]*)/gi;

const broken = [];
const seen = new Set();

function scanFile(filePath) {
  let src;
  try {
    src = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return;
  }
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const re of [hrefRe, pushRe]) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(line)) !== null) {
        const raw = match[1];
        const href = raw.split('?')[0].split('#')[0];
        if (SKIP_PREFIXES.some((p) => href.startsWith(p))) continue;
        if (STATIC_EXT.test(href)) continue;
        if (href.includes('[') || href.includes('{') || href.includes('$')) continue;
        if (href.length < 2) continue;
        const key = filePath + ':' + href;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!routeExists(href)) {
          broken.push({ file: filePath.replace(root + '/', ''), line: i + 1, href });
        }
      }
    }
  }
}

// Load quarantine allowlist — only scan Netlify-compiled app dirs
const quarantineSrc = fs.readFileSync(
  path.join(root, 'scripts/check-internal-links.mjs'),
  'utf8',
);
const allowedMatch = quarantineSrc.match(/const ALLOWED_TOP_LEVEL\s*=\s*new Set\(\[([^\]]+)\]\)/s);
const ALLOWED_TOP_LEVEL = allowedMatch
  ? new Set(allowedMatch[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, '')))
  : null;

function walk(dir, isAppRoot = false) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // At the app/ root level, skip quarantined directories
      if (isAppRoot && ALLOWED_TOP_LEVEL && !ALLOWED_TOP_LEVEL.has(entry.name)) {
        // Also allow route groups (parenthesized) and special dirs
        if (!entry.name.startsWith('(') && !entry.name.startsWith('_')) continue;
      }
      // Skip Railway-only double-underscore subdirectories (not compiled on Netlify)
      if (entry.name.startsWith('__')) continue;
      walk(full, false);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      scanFile(full);
    }
  }
}

walk(path.join(root, 'app'), true);
walk(path.join(root, 'components/site'));
walk(path.join(root, 'components/marketing'));
walk(path.join(root, 'components/layout'));

if (!broken.length) {
  console.log('✅ Zero broken internal links');
  process.exit(0);
}

const byFile = {};
for (const b of broken) {
  (byFile[b.file] = byFile[b.file] || []).push(b);
}

console.log(`❌ BROKEN LINKS: ${broken.length} across ${Object.keys(byFile).length} files\n`);
for (const [file, items] of Object.entries(byFile).sort()) {
  console.log(file);
  for (const { line, href } of items) {
    console.log('  L' + String(line).padEnd(5), href);
  }
}
process.exit(1);
