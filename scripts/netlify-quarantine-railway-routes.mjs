/**
 * netlify-quarantine-railway-routes.mjs
 *
 * Physically moves Railway-only app/ directories out before Next.js route
 * discovery runs. Uses an ALLOWLIST — everything not explicitly permitted
 * is quarantined automatically. New Railway routes are safe by default.
 *
 * Usage:
 *   NETLIFY=true node scripts/netlify-quarantine-railway-routes.mjs
 *   node scripts/netlify-quarantine-railway-routes.mjs --restore
 *   node scripts/netlify-quarantine-railway-routes.mjs --force   (local test)
 */

import { rename, mkdir, readdir, cp, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const RESTORE   = process.argv.includes('--restore');
const FORCE     = process.argv.includes('--force');
const IS_NETLIFY = process.env.NETLIFY === 'true' || FORCE;

if (!IS_NETLIFY && !RESTORE) {
  console.log('[quarantine] Not on Netlify — skipping. Use --force to run locally.');
  process.exit(0);
}

const ROOT           = process.cwd();
const APP_DIR        = join(ROOT, 'app');
const QUARANTINE_DIR = join(ROOT, '.netlify-quarantine', 'app');

// ALLOWLIST: top-level app/ directories Netlify may compile.
// Everything else is quarantined automatically.
const ALLOWED_TOP_LEVEL = new Set([
  'about', 'contact', 'programs', 'apply', 'check-eligibility',
  'eligibility', 'privacy', 'terms', 'accessibility', 'providers',
  'resources', 'funding', 'partners',
]);

// Root-level files that must stay (Next.js requires them)
const ALLOWED_ROOT_FILES = new Set([
  'page.tsx', 'page.ts', 'layout.tsx', 'layout.ts', 'globals.css',
  'not-found.tsx', 'not-found.ts', 'error.tsx', 'error.ts',
  'loading.tsx', 'loading.ts', 'template.tsx', 'template.ts',
  'robots.ts', 'sitemap.ts', 'favicon.ico',
]);

// Forbidden nested segments — quarantine even inside allowed top-level dirs
const FORBIDDEN_SEGMENTS = new Set([
  'admin', 'api', 'lms', 'learner', 'student', 'dashboard', 'my-dashboard',
  'instructor', 'employer', 'partner-dashboard', 'program-holder', 'staff-portal',
  'case-manager', 'proctor', 'creator', 'builder', 'generate', 'reports',
  'approvals', 'account', 'profile', 'settings', 'billing', 'checkout', 'pay',
  'payment', 'enroll', 'enrollment', 'messages', 'notifications', 'certificates',
  'credentials', 'transcript', 'advising', 'documents', 'compliance', 'apprentice',
  'schedule', 'videos', 'video', 'ai', 'ai-chat', 'ai-studio', 'ai-tutor',
  'supersonic', 'tax', 'pwa',
]);

async function moveEntry(src, dest) {
  await mkdir(dirname(dest), { recursive: true });
  try {
    await rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      await cp(src, dest, { recursive: true });
      await rm(src, { recursive: true, force: true });
    } else throw e;
  }
}

async function countRoutes(dir) {
  let count = 0;
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (e.isDirectory()) count += await countRoutes(join(dir, e.name));
    else if (['page.tsx','page.ts','route.ts','route.tsx'].includes(e.name)) count++;
  }
  return count;
}

async function collectForbiddenNested(dir, quarantineBase, toMove) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const src = join(dir, entry.name);
    const dest = join(quarantineBase, entry.name);
    if (FORBIDDEN_SEGMENTS.has(entry.name)) {
      const rel = src.replace(APP_DIR + '/', '');
      toMove.push({ src, dest, label: rel });
    } else {
      await collectForbiddenNested(src, dest, toMove);
    }
  }
}

async function quarantine() {
  const before = await countRoutes(APP_DIR);
  const entries = await readdir(APP_DIR, { withFileTypes: true });
  const toMove = [];

  for (const entry of entries) {
    const name = entry.name;
    const src  = join(APP_DIR, name);
    const dest = join(QUARANTINE_DIR, name);

    if (!entry.isDirectory()) {
      if (!ALLOWED_ROOT_FILES.has(name)) toMove.push({ src, dest, label: name });
      continue;
    }

    // Route groups (auth), (marketing), etc. and _private dirs — quarantine all
    if (name.startsWith('(') || name.startsWith('_')) {
      toMove.push({ src, dest, label: name });
      continue;
    }

    // Not in allowlist → quarantine
    if (!ALLOWED_TOP_LEVEL.has(name)) {
      toMove.push({ src, dest, label: name });
      continue;
    }

    // In allowlist — scan for forbidden nested segments
    await collectForbiddenNested(src, dest, toMove);
  }

  console.log(`[quarantine] Before: ${before} routes in app/`);
  console.log(`[quarantine] Quarantining ${toMove.length} entries...`);
  for (const { src, dest, label } of toMove) {
    await moveEntry(src, dest);
    console.log(`  ✓ ${label}`);
  }
  const after = await countRoutes(APP_DIR);
  console.log(`[quarantine] After: ${after} routes in app/ (removed ${before - after})`);
}

async function restoreRecursive(srcDir, destDir) {
  let entries;
  try { entries = await readdir(srcDir, { withFileTypes: true }); } catch { return 0; }
  let n = 0;
  for (const entry of entries) {
    const src  = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory() && existsSync(dest)) {
      // Destination directory already exists — merge recursively
      n += await restoreRecursive(src, dest);
      await rm(src, { recursive: true, force: true });
    } else {
      await moveEntry(src, dest);
      n++;
    }
  }
  return n;
}

async function restore() {
  if (!existsSync(QUARANTINE_DIR)) { console.log('[quarantine] Nothing to restore.'); return; }
  const entries = await readdir(QUARANTINE_DIR, { withFileTypes: true });
  console.log(`[quarantine] Restoring ${entries.length} top-level entries...`);
  const n = await restoreRecursive(QUARANTINE_DIR, APP_DIR);
  console.log(`[quarantine] Restored ${n} entries.`);
}

if (RESTORE) { await restore(); } else { await quarantine(); }
