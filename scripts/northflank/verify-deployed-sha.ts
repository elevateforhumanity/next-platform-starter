#!/usr/bin/env tsx
/**
 * Compare Northflank deployed SHA vs expected main commit.
 * Fails CI when production is still on an old image after a deploy workflow.
 *
 *   EXPECTED_SHA=$(git rev-parse origin/main) pnpm tsx scripts/northflank/verify-deployed-sha.ts
 *   pnpm tsx scripts/northflank/verify-deployed-sha.ts --trigger  # rebuild stale services
 */

import { execSync } from 'node:child_process';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type ServiceStatus = {
  vcsData?: { projectBranch?: string };
  deployment?: { internal?: { deployedSHA?: string; branch?: string } };
  status?: { build?: { status?: string }; deployment?: { status?: string } };
};

const ALL_SERVICES = ['elevate-lms', 'elevate-admin'] as const;

function resolveExpectedSha(): string {
  if (process.env.EXPECTED_SHA || process.env.GITHUB_SHA) {
    return (process.env.EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
  }
  try {
    return execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
  } catch {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  }
}

function shaMatches(deployed: string | undefined, expected: string): boolean {
  if (!deployed || !expected) return false;
  const d = deployed.toLowerCase();
  const e = expected.toLowerCase();
  return d === e || d.startsWith(e.slice(0, 7)) || e.startsWith(d.slice(0, 7));
}

async function triggerBuild(projectId: string, serviceId: string) {
  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/build`), {
    method: 'POST',
    body: JSON.stringify({}),
  });
  console.log(`[trigger] ${serviceId}`);
}

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) process.exit(1);

  const expected = resolveExpectedSha();
  const trigger = process.argv.includes('--trigger');
  const onlyArg = process.argv.find((a) => a.startsWith('elevate-'));
  const services = onlyArg
    ? ([onlyArg] as readonly string[])
    : process.env.NORTHFLANK_VERIFY_SERVICE
      ? [process.env.NORTHFLANK_VERIFY_SERVICE]
      : ALL_SERVICES;
  let stale = false;

  console.log(`Expected production SHA (main): ${expected.slice(0, 12)}…\n`);

  for (const serviceId of services) {
    const s = await nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`));
    const deployed =
      s.deployment?.internal?.deployedSHA ??
      (s as { deployedSHA?: string }).deployedSHA;
    const branch = s.vcsData?.projectBranch ?? s.deployment?.internal?.branch ?? '?';
    const build = s.status?.build?.status ?? '?';
    const deploy = s.status?.deployment?.status ?? '?';
    const ok = shaMatches(deployed, expected);

    console.log(
      `${serviceId}: branch=${branch} build=${build} deploy=${deploy}\n  deployed=${deployed?.slice(0, 12) ?? 'unknown'}…  ${ok ? '✅ current' : '❌ STALE'}`,
    );

    if (!ok) {
      stale = true;
      if (trigger) await triggerBuild(projectId, serviceId);
    }
  }

  if (stale && !trigger) {
    console.error(
      '\nProduction is behind main. Wait for in-flight builds or run:\n  pnpm tsx scripts/northflank/verify-deployed-sha.ts --trigger',
    );
    process.exit(1);
  }

  if (stale && trigger) {
    console.log('\nTriggered rebuild for stale service(s). Monitor Northflank UI or wait-service.ts');
    process.exit(0);
  }

  console.log('\nAll services match main.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
