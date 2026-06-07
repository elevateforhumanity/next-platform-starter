#!/usr/bin/env node
/**
 * Live portal auth audit — unauthenticated requests must redirect to login (307/302).
 * Usage: SMOKE_BASE_URL=https://www.elevateforhumanity.org node scripts/audit-portal-auth-live.mjs
 */
const BASE = (process.env.SMOKE_BASE_URL || 'https://www.elevateforhumanity.org').replace(/\/$/, '');

const PROTECTED_PATHS = [
  '/learner/dashboard',
  '/lms/dashboard',
  '/lms/courses',
  '/employer/dashboard',
  '/partner/dashboard',
  '/program-holder/dashboard',
  '/mentor/dashboard',
  '/case-manager/dashboard',
  '/portal/barber',
  '/portal/cosmetology',
  '/apprentice/timeclock',
  '/admin/dashboard',
];

const PUBLIC_OK = ['/employer', '/partner', '/program-holder', '/portals', '/login'];

let failed = 0;

async function check(path, expectAuthRedirect) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  const loc = res.headers.get('location') || '';
  const isLoginRedirect =
    [301, 302, 307, 308].includes(res.status) &&
    (loc.includes('/login') || loc.includes('admin.elevateforhumanity.org'));
  const pass = expectAuthRedirect ? isLoginRedirect : res.status === 200;
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${path} → ${res.status}${loc ? ` → ${loc.slice(0, 60)}` : ''}`);
  if (!pass) failed++;
}

console.log(`Portal auth audit — ${BASE}\n`);

for (const p of PROTECTED_PATHS) await check(p, true);
console.log('');
for (const p of PUBLIC_OK) await check(p, false);

console.log(failed ? `\n❌ ${failed} failed` : '\n✅ All portal auth checks passed');
process.exit(failed ? 1 : 0);
