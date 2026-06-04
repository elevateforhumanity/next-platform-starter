#!/usr/bin/env tsx
/**
 * Verify Northflank HTTP health probes on LMS and Admin (combined services).
 *
 *   pnpm tsx scripts/northflank/verify-health-checks.ts
 *   pnpm tsx scripts/northflank/configure-services.ts --execute
 *   pnpm tsx scripts/northflank/verify-health-checks.ts
 */

import { execSync } from 'node:child_process';

const EXPECTED_HEALTH_SNIPPET = 'startupProbe:/api/ping:8080, readinessProbe:/api/ping:8080';

async function main() {
  let ok = true;

  console.log('Applying idempotent health probe config (configure-services --execute)...\n');
  const out = execSync('pnpm exec tsx scripts/northflank/configure-services.ts --execute', {
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  console.log(out);

  for (const serviceId of ['elevate-lms', 'elevate-admin']) {
    const line = out
      .split('\n')
      .find((l) => l.includes(`[patch-ok] ${serviceId}`) && l.includes('health=['));
    console.log(`\n=== ${serviceId} ===`);
    if (!line?.includes(EXPECTED_HEALTH_SNIPPET)) {
      console.error(`  Expected health=[${EXPECTED_HEALTH_SNIPPET}] in patch response`);
      console.error(`  Got: ${line ?? '(no patch-ok line)'}`);
      ok = false;
    } else {
      console.log(`  Northflank probes: ${EXPECTED_HEALTH_SNIPPET}`);
    }
  }

  console.log('\nPublic smoke (live URLs):');
  for (const url of [
    'https://www.elevateforhumanity.org/api/ping',
    'https://admin.elevateforhumanity.org/api/ping',
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      console.log(`  ${url} → HTTP ${res.status}`);
      if (!res.ok) ok = false;
    } catch (e) {
      console.error(`  ${url} → failed:`, e);
      ok = false;
    }
  }

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
