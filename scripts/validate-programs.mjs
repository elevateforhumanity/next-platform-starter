#!/usr/bin/env node
/**
 * validate-programs.mjs
 *
 * Build-time program integrity check.
 * Fails with exit code 1 if any registered program is missing required fields
 * or if a registered slug has no resolvable public route.
 *
 * Run: node scripts/validate-programs.mjs
 * CI:  added to build command in netlify.toml after pnpm run build
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// ── Load the static program map via the compiled manifest ─────────────────
// We can't import TypeScript directly, so we read the data files as text
// and extract slugs + required fields via regex. This is intentionally
// lightweight — the TypeScript compiler already validates types at build time.

// Required fields every ProgramSchema must have (non-empty)
const REQUIRED_FIELDS = ['slug', 'title', 'subtitle', 'sector', 'selfPayCost', 'durationWeeks'];

// Programs that are intentionally not public (internal/reporting only)
const INTERNAL_SLUGS = new Set([]);

// Read index.ts to get all registered slugs
const indexPath = join(ROOT, 'data/programs/index.ts');
const indexContent = readFileSync(indexPath, 'utf8');

// Extract imported file names
const importedFiles = [...indexContent.matchAll(/from '\.\/([^']+)'/g)].map((m) => m[1]);

// Extract slugs from STATIC_PROGRAMS array entries
const registeredExports = [...indexContent.matchAll(/^\s{2}([A-Z_]+),/gm)].map((m) => m[1]);

let errors = 0;
let warnings = 0;
const slugsSeen = new Set();

console.log(`\n[validate-programs] Checking ${importedFiles.length} program data files...\n`);

for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) {
    console.error(`  ❌ MISSING FILE: data/programs/${file}.ts`);
    errors++;
    continue;
  }

  const content = readFileSync(filePath, 'utf8');

  // Extract slug
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  if (!slugMatch) {
    console.error(`  ❌ ${file}.ts — no slug field`);
    errors++;
    continue;
  }
  const slug = slugMatch[1];

  // Duplicate slug check
  if (slugsSeen.has(slug)) {
    console.error(`  ❌ DUPLICATE SLUG: "${slug}" appears in multiple data files`);
    errors++;
  }
  slugsSeen.add(slug);

  // Required field checks
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    const pattern = new RegExp(`\\b${field}:\\s*`);
    if (!pattern.test(content)) missing.push(field);
  }
  if (missing.length > 0) {
    console.error(`  ❌ ${slug} — missing required fields: ${missing.join(', ')}`);
    errors++;
    continue;
  }

  // Route check — must have either own page.tsx or be in STATIC_PROGRAM_MAP
  const ownPage = join(ROOT, 'app/programs', slug, 'page.tsx');
  const inMap = indexContent.includes(`'${slug}'`) || indexContent.includes(`"${slug}"`);
  const hasOwnPage = existsSync(ownPage);

  if (!hasOwnPage && !inMap) {
    console.error(`  ❌ ${slug} — no route: missing app/programs/${slug}/page.tsx and not in STATIC_PROGRAM_MAP`);
    errors++;
    continue;
  }

  // Funding field check (warning only — not all programs have explicit funding yet)
  if (!content.includes('funding:') && !content.includes('isSelfPay: true')) {
    console.warn(`  ⚠️  ${slug} — no explicit funding{} block (add for agency reporting)`);
    warnings++;
  }

  console.log(`  ✅ ${slug}`);
}

// Check for duplicate slugs across next.config.mjs redirects pointing to programs
const nextConfig = readFileSync(join(ROOT, 'next.config.mjs'), 'utf8');
const programRedirects = [...nextConfig.matchAll(/source:\s*['"]\/programs\/([^'"]+)['"]/g)].map((m) => m[1]);
const redirectTargets = [...nextConfig.matchAll(/destination:\s*['"]\/programs\/([^'"]+)['"]/g)].map((m) => m[1]);

// Warn if a redirect target doesn't exist as a registered slug
for (const target of redirectTargets) {
  // Strip sub-paths
  const targetSlug = target.split('/')[0];
  if (!slugsSeen.has(targetSlug) && !INTERNAL_SLUGS.has(targetSlug)) {
    console.warn(`  ⚠️  next.config redirect target /programs/${target} — slug "${targetSlug}" not in registry`);
    warnings++;
  }
}

console.log(`\n[validate-programs] ${slugsSeen.size} programs checked`);
if (warnings > 0) console.warn(`[validate-programs] ${warnings} warning(s) — non-blocking`);

if (errors > 0) {
  console.error(`\n[validate-programs] ❌ ${errors} error(s) — fix before deploying\n`);
  process.exit(1);
} else {
  console.log(`[validate-programs] ✅ All programs valid\n`);
}
