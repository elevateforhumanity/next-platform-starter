#!/usr/bin/env tsx
/**
 * route-audit.ts
 *
 * Walks app/ and reports:
 *   1. Duplicate resolved routes — two page.tsx files that compile to the same URL
 *      (route groups like (app) are stripped from the path, so
 *       app/(app)/foo/page.tsx and app/foo/page.tsx would collide)
 *   2. Banned path prefixes — directories that were deleted as part of the
 *      portal consolidation. A new file appearing under these prefixes means
 *      someone re-introduced a duplicate without going through review.
 *   3. Redirect stubs that still exist as page files — a page whose only
 *      content is permanentRedirect() should be deleted; the redirect belongs
 *      in next.config.mjs or proxy.ts.
 *
 * Usage:
 *   pnpm route:audit            — print report, exit 0
 *   pnpm route:audit --strict   — exit 1 if any issue found (use in CI)
 */

import fs from 'fs';
import path from 'path';

const STRICT = process.argv.includes('--strict');
const APP_DIR = path.join(process.cwd(), 'app');

// ─── Banned prefixes ──────────────────────────────────────────────────────────
// These directory trees were deleted during portal consolidation.
// Any page.tsx appearing here is a regression.
const BANNED_PREFIXES = [
  'employer-portal',
  'programs/admin',
];

// ─── Banned API prefixes ──────────────────────────────────────────────────────
// These API namespaces are wrong. Canonical equivalents are noted.
// Any new route.ts appearing here is a regression.
// Existing routes with consumers are grandfathered — do not move without updating consumers.
const BANNED_API_PREFIXES = [
  // /api/cm/* → /api/case-manager/* (0 consumers, wrong namespace)
  'api/cm/',
  // /api/cert/* → /api/certificates/* (0 consumers, wrong namespace)
  'api/cert/',
  // /api/donations/* → /api/donate/* (0 consumers, duplicate)
  'api/donations/',
  // /api/licensing/request → /api/licenses/request (0 consumers, duplicate)
  'api/licensing/',
  // /api/program-owner/* → /api/program-holder/* (0 consumers, wrong namespace)
  'api/program-owner/',
];

// ─── Walk ─────────────────────────────────────────────────────────────────────
interface PageFile {
  file: string;       // absolute path
  route: string;      // resolved URL (route groups stripped)
}

function resolveRoute(absPath: string): string {
  const rel = absPath
    .replace(APP_DIR, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\\/g, '/');

  // Strip route group segments: (foo)/ → ''
  const resolved = rel.replace(/\/\([^)]+\)/g, '') || '/';
  return resolved || '/';
}

function walk(dir: string, results: PageFile[], includeApi = false): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next') continue;
      if (entry.name === 'api' && !includeApi) continue;
      walk(full, results, includeApi);
    } else if (entry.name === 'page.tsx' || (includeApi && entry.name === 'route.ts')) {
      results.push({ file: full, route: resolveRoute(full) });
    }
  }
}

const pages: PageFile[] = [];
walk(APP_DIR, pages);

// Also walk api dir for banned API prefix check
const apiRoutes: PageFile[] = [];
walk(APP_DIR, apiRoutes, true);

// ─── Check 1: Duplicate resolved routes ───────────────────────────────────────
const routeMap = new Map<string, string[]>();
for (const p of pages) {
  const existing = routeMap.get(p.route) ?? [];
  existing.push(p.file.replace(process.cwd() + '/', ''));
  routeMap.set(p.route, existing);
}

const duplicates = [...routeMap.entries()].filter(([, files]) => files.length > 1);

// ─── Check 2: Banned page prefixes ────────────────────────────────────────────
const bannedHits = pages.filter(p => {
  const rel = p.file.replace(APP_DIR + '/', '');
  return BANNED_PREFIXES.some(prefix => rel.startsWith(prefix + '/') || rel === prefix);
});

// ─── Check 2b: Banned API prefixes ────────────────────────────────────────────
const bannedApiHits = apiRoutes.filter(p => {
  if (!p.file.includes('/api/')) return false;
  const rel = p.file.replace(APP_DIR + '/', '');
  return BANNED_API_PREFIXES.some(prefix => rel.startsWith(prefix));
});

// ─── Check 3: Redirect stubs ──────────────────────────────────────────────────
// A page file is a stub if its only substantive content is a permanentRedirect call
// and it has no real UI. Heuristic: file is ≤ 20 lines and contains permanentRedirect.
const stubs = pages.filter(p => {
  try {
    const content = fs.readFileSync(p.file, 'utf8');
    const lines = content.split('\n').filter(l => l.trim()).length;
    return lines <= 20 && content.includes('permanentRedirect');
  } catch {
    return false;
  }
});

// ─── Report ───────────────────────────────────────────────────────────────────
let issues = 0;

console.log('\n══════════════════════════════════════════════');
console.log('  ROUTE AUDIT');
console.log('══════════════════════════════════════════════\n');

if (duplicates.length === 0) {
  console.log('✅  No duplicate routes\n');
} else {
  issues += duplicates.length;
  console.log(`❌  DUPLICATE ROUTES (${duplicates.length})\n`);
  for (const [route, files] of duplicates) {
    console.log(`  ${route}`);
    for (const f of files) console.log(`    → ${f}`);
    console.log('');
  }
}

if (bannedHits.length === 0) {
  console.log('✅  No banned page prefixes\n');
} else {
  issues += bannedHits.length;
  console.log(`❌  BANNED PAGE PREFIXES — deleted portal directories re-introduced (${bannedHits.length})\n`);
  for (const p of bannedHits) {
    console.log(`  ${p.file.replace(process.cwd() + '/', '')}`);
  }
  console.log('');
}

if (bannedApiHits.length === 0) {
  console.log('✅  No banned API prefixes\n');
} else {
  issues += bannedApiHits.length;
  console.log(`❌  BANNED API PREFIXES — wrong namespace, use canonical equivalent (${bannedApiHits.length})\n`);
  console.log('    Canonical mappings:');
  console.log('      /api/cm/*         → /api/case-manager/*');
  console.log('      /api/cert/*       → /api/certificates/*');
  console.log('      /api/donations/*  → /api/donate/*');
  console.log('      /api/licensing/*  → /api/licenses/*');
  console.log('      /api/program-owner/* → /api/program-holder/*\n');
  for (const p of bannedApiHits) {
    console.log(`  ${p.file.replace(process.cwd() + '/', '')}`);
  }
  console.log('');
}

if (stubs.length === 0) {
  console.log('✅  No redirect stubs\n');
} else {
  issues += stubs.length;
  console.log(`⚠️   REDIRECT STUBS — page files that only call permanentRedirect() (${stubs.length})`);
  console.log('    These should be deleted; the redirect belongs in next.config.mjs\n');
  for (const p of stubs) {
    console.log(`  ${p.file.replace(process.cwd() + '/', '')}  →  ${p.route}`);
  }
  console.log('');
}

console.log(`Pages scanned: ${pages.length}  |  API routes scanned: ${apiRoutes.filter(r => r.file.includes('/api/')).length}`);
console.log(`Issues found: ${issues}`);
console.log('══════════════════════════════════════════════\n');

if (STRICT && issues > 0) {
  process.exit(1);
}
