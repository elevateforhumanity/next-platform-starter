#!/usr/bin/env tsx
/**
 * Wait for a Northflank service deployment/build to settle.
 *
 * Usage:
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-admin
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-lms --timeout-ms 1200000
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type ServiceStatus = {
  deploymentStatus?: { status?: string };
  buildStatus?: string;
};

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: pnpm tsx scripts/northflank/wait-service.ts <service-id> [--timeout-ms 900000]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const timeoutMs = Number(argValue('--timeout-ms') || 900_000);
  const start = Date.now();
  let last = '';

  while (Date.now() - start < timeoutMs) {
    const service = await nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`));
    const status = service.deploymentStatus?.status ?? service.buildStatus ?? 'unknown';

    if (status !== last) {
      console.log(`${serviceId}: ${status}`);
      last = status;
    }

    if (['COMPLETED', 'RUNNING', 'SUCCESS'].includes(status)) {
      return;
    }
    if (['FAILED', 'ERROR'].includes(status)) {
      console.error(`${serviceId} failed with status ${status}`);
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  console.error(`${serviceId} did not settle within ${timeoutMs}ms`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
