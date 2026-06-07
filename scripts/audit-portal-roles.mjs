#!/usr/bin/env node
/**
 * Cross-check role destinations vs proxy.ts PROTECTED_ROUTES prefixes.
 * Run: node scripts/audit-portal-roles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const proxySrc = fs.readFileSync(path.join(root, 'proxy.ts'), 'utf8');
const roleSrc = fs.readFileSync(path.join(root, 'lib/auth/role-destinations.ts'), 'utf8');

const destMatch = roleSrc.match(/ROLE_DESTINATIONS[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!destMatch) {
  console.error('Could not parse ROLE_DESTINATIONS');
  process.exit(1);
}

const destinations = {};
for (const line of destMatch[1].split('\n')) {
  const m = line.match(/^\s*([a-z_]+):\s*['"]([^'"]+)['"]/);
  if (m) destinations[m[1]] = m[2];
}

const routeRe = /'([^']+)':\s*\[([^\]]+)\]/g;
const routes = [];
let rm;
while ((rm = routeRe.exec(proxySrc))) {
  if (!rm[1].startsWith('/')) continue;
  routes.push({ prefix: rm[1], roles: rm[2].match(/'([^']+)'/g)?.map((r) => r.slice(1, -1)) ?? [] });
}

function prefixForPath(urlPath) {
  if (urlPath.startsWith('http')) {
    try {
      return new URL(urlPath).pathname;
    } catch {
      return null;
    }
  }
  return urlPath.split('?')[0];
}

function findRouteRoles(urlPath) {
  const normalized = prefixForPath(urlPath);
  if (!normalized) return null;
  let best = null;
  for (const r of routes) {
    if (normalized === r.prefix || normalized.startsWith(r.prefix)) {
      if (!best || r.prefix.length > best.prefix.length) best = r;
    }
  }
  return best;
}

let issues = 0;
console.log('Role → destination → middleware coverage\n');
for (const [role, dest] of Object.entries(destinations)) {
  const route = findRouteRoles(dest);
  const isAdminHost = dest.startsWith('http') && dest.includes('admin.');
  const ok =
    isAdminHost ||
    route?.roles.includes(role) ||
    ['admin', 'super_admin'].some((a) => route?.roles.includes(a));
  const flag = ok ? '✅' : '❌';
  if (!ok) issues++;
  console.log(
    `${flag} ${role.padEnd(16)} → ${dest.padEnd(52)} ${route ? `[${route.prefix}: ${route.roles.join(', ')}]` : '[no PROTECTED_ROUTES match]'}`,
  );
}

console.log(`\n${issues} role(s) may hit /unauthorized after login.`);
process.exit(issues > 0 ? 1 : 0);
