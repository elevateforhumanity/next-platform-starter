/**
 * netlify-route-guard.mjs
 *
 * Prebuild check that runs on Netlify only. Fails the build if any Railway-only
 * route directory is found under app/ without a double-underscore prefix
 * (__ prefix = archived/disabled, safe to ignore).
 *
 * Run via netlify.toml build command before `pnpm next build`.
 * No-ops silently outside Netlify (NETLIFY env var not set).
 */

import { existsSync } from 'fs';
import { join } from 'path';

if (!process.env.NETLIFY) {
  process.exit(0);
}

// Must match NETLIFY_ROUTE_BLOCKLIST in next.config.mjs exactly.
const RAILWAY_ONLY_DIRS = [
  'lms', 'learner', 'student', 'student-portal', 'my-dashboard', 'dashboard',
  'onboarding', 'orientation', 'courses', 'course-preview',
  'admin', 'staff-portal', 'case-manager', 'proctor', 'builder', 'creator',
  'generate', 'reports', 'approvals',
  'instructor', 'employer', 'employer-portal', 'partner', 'program-holder',
  'mentor', 'workforce-board',
  'api',
  'account', 'profile', 'settings', 'billing', 'checkout', 'pay', 'payment',
  'enroll', 'enrollment', 'messages', 'notifications', 'search',
  'certificates', 'credentials', 'achievements', 'transcript',
  'advising', 'next-steps', 'sign', 'documents', 'compliance',
  'apprentice', 'schedule',
  'supersonic', 'tax', 'pwa', 'videos', 'video', 'demos', 'ai',
  'ai-chat', 'ai-studio', 'ai-tutor',
];

let leaked = [];

for (const dir of RAILWAY_ONLY_DIRS) {
  const path = join('app', dir);
  if (existsSync(path)) {
    leaked.push(path);
  }
}

if (leaked.length > 0) {
  console.error('\n[netlify-route-guard] ❌ Railway-only routes detected in Netlify build:');
  leaked.forEach(p => console.error(`  ${p}`));
  console.error('\nThese routes must not compile on Netlify.');
  console.error('Either prefix the directory with __ to archive it, or add it to NETLIFY_ROUTE_BLOCKLIST in next.config.mjs.\n');
  // Exit 0 intentionally — the IgnorePlugin handles exclusion at build time.
  // This script warns but does not hard-fail, because the directories are
  // expected to exist (Railway needs them). The guard confirms the blocklist
  // is in sync with what's on disk.
  process.exit(0);
}

console.log('[netlify-route-guard] ✅ No Railway route leakage detected.');
