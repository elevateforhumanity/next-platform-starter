#!/usr/bin/env tsx
/**
 * Roll out the latest successful build for a Northflank combined service.
 *
 * Use when builds succeed but deployedSHA is stale (e.g. disabledCD was true).
 *
 *   pnpm tsx scripts/northflank/trigger-deployment.ts elevate-admin
 *   pnpm tsx scripts/northflank/trigger-deployment.ts elevate-admin --sha 9291b43c...
 *   pnpm tsx scripts/northflank/trigger-deployment.ts elevate-lms --build-id abc123
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: pnpm tsx scripts/northflank/trigger-deployment.ts <service-id> [--sha <commit>] [--build-id <id>]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const sha = argValue('--sha');
  const buildId = argValue('--build-id');
  const branch = process.env.DEPLOY_BRANCH || 'main';

  const payload: Record<string, unknown> = {
    internal: {
      id: serviceId,
      branch,
    },
    docker: { configType: 'default' as const },
  };

  // Prefer specific build ID, then SHA, then fallback to latest
  if (buildId) {
    (payload.internal as Record<string, unknown>).buildId = buildId;
    console.log(`Deploying specific build: ${buildId}`);
  } else if (sha) {
    (payload.internal as Record<string, unknown>).buildSHA = sha;
  } else {
    (payload.internal as Record<string, unknown>).buildSHA = 'latest';
  }

  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/deployment`), {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(
    `Triggered deployment for ${serviceId} (branch=${branch}, buildId=${buildId ?? 'latest'})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
