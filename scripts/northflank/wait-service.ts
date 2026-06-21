#!/usr/bin/env tsx
/**
 * Wait for a Northflank service deployment/build to settle.
 *
 * Usage:
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-admin
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-lms --timeout-ms 1200000
 *   pnpm tsx scripts/northflank/wait-service.ts elevate-admin --build-id <id>
 */

import { nfFetch, projectApiPath, resolveProjectId } from './lib';

type ServiceStatus = {
  deploymentStatus?: { status?: string };
  buildStatus?: string;
  status?: {
    build?: { status?: string; lastTransitionTime?: string };
    deployment?: { status?: string; reason?: string; lastTransitionTime?: string };
  };
};

type ServiceBuild = {
  id: string;
  branch?: string;
  status?: string;
  sha?: string;
  concluded?: boolean;
  success?: boolean;
  message?: string | null;
  createdAt?: string;
  buildConcludedAt?: number;
};

type ServiceBuildList = {
  builds?: ServiceBuild[];
};

type BuildLogLine = {
  containerId?: string;
  log?: string;
  ts?: string;
};

const BUILD_FAILURE_STATUSES = new Set([
  'ABORTED',
  'CRASHED',
  'ERROR',
  'FAILED',
  'FAILURE',
  'SUBMISSION_FAILURE',
]);
const BUILD_DONE_STATUSES = new Set(['SUCCESS', 'COMPLETED', 'SKIPPED']);
const DEPLOY_READY_STATUSES = new Set(['COMPLETED', 'RUNNING', 'SUCCESS']);
const DEPLOY_FAILURE_STATUSES = new Set(['FAILED', 'ERROR']);

function resolveServicePhase(service: ServiceStatus): string {
  const build = service.status?.build?.status ?? service.buildStatus;
  const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;

  if (build && !BUILD_DONE_STATUSES.has(build)) {
    return build;
  }
  if (deploy) return deploy;
  return build ?? deploy ?? 'unknown';
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(
      /((?:token|secret|password|authorization|api[_-]?key|private[_-]?key)[\w-]*\s*[:=]\s*)[^\s,;]+/gi,
      '$1[redacted]',
    );
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      if (/token|secret|password|authorization|api[_-]?key|private[_-]?key/i.test(key)) {
        return [key, '[redacted]'];
      }
      return [key, redactValue(nested)];
    }),
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function resolveBuildId(
  projectId: string,
  serviceId: string,
  preferredBuildId?: string,
): Promise<string | undefined> {
  const normalized = preferredBuildId?.trim();
  if (normalized) return normalized;

  try {
    const list = await nfFetch<ServiceBuildList>(
      projectApiPath(projectId, `/services/${serviceId}/build?per_page=1`),
    );
    return list.builds?.[0]?.id;
  } catch (error) {
    console.error(`Could not resolve latest Northflank build id: ${formatError(error)}`);
    return undefined;
  }
}

async function fetchBuildDetails(
  projectId: string,
  serviceId: string,
  buildId: string,
): Promise<ServiceBuild | undefined> {
  try {
    return await nfFetch<ServiceBuild>(
      projectApiPath(projectId, `/services/${serviceId}/build/${buildId}`),
    );
  } catch (error) {
    console.error(`Could not fetch Northflank build ${buildId}: ${formatError(error)}`);
    return undefined;
  }
}

async function printBuildLogs(
  projectId: string,
  serviceId: string,
  buildId: string,
): Promise<void> {
  const params = new URLSearchParams({
    buildId,
    queryType: 'range',
    endTime: new Date().toISOString(),
    duration: '3600',
    lineLimit: '200',
    direction: 'backward',
  });

  try {
    const logs = await nfFetch<BuildLogLine[]>(
      projectApiPath(projectId, `/services/${serviceId}/build-logs?${params.toString()}`),
    );

    if (!Array.isArray(logs) || logs.length === 0) {
      console.error(`No Northflank build logs returned for ${serviceId} build ${buildId}.`);
      return;
    }

    console.error(`Last ${logs.length} Northflank build log lines for ${serviceId} build ${buildId}:`);
    for (const entry of logs) {
      const timestamp = entry.ts ? `${entry.ts} ` : '';
      console.error(redactText(`${timestamp}${entry.log ?? ''}`));
    }
  } catch (error) {
    console.error(`Could not fetch Northflank build logs for ${buildId}: ${formatError(error)}`);
  }
}

async function printFailureDiagnostics(
  projectId: string,
  serviceId: string,
  buildId: string | undefined,
  service: ServiceStatus,
): Promise<void> {
  const resolvedBuildId = await resolveBuildId(projectId, serviceId, buildId);
  const build = resolvedBuildId
    ? await fetchBuildDetails(projectId, serviceId, resolvedBuildId)
    : undefined;

  console.error(`${serviceId} failure diagnostics:`);
  console.error(
    JSON.stringify(
      redactValue({
        buildId: resolvedBuildId,
        build,
        serviceStatus: service,
      }),
      null,
      2,
    ),
  );

  if (resolvedBuildId) {
    await printBuildLogs(projectId, serviceId, resolvedBuildId);
  }
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId || serviceId.startsWith('--')) {
    console.error('Usage: pnpm tsx scripts/northflank/wait-service.ts <service-id> [--timeout-ms 900000] [--sha <commit>]');
    process.exit(1);
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const timeoutMs = Number(argValue('--timeout-ms') || 900_000);
  const targetSha = argValue('--sha');
  const start = Date.now();
  let last = '';
  let lastService: ServiceStatus | undefined;

  console.log(`${serviceId}: Waiting for deployment (sha=${targetSha ?? 'latest'})...`);

  while (Date.now() - start < timeoutMs) {
    const service = await nfFetch<ServiceStatus>(projectApiPath(projectId, `/services/${serviceId}`));
    lastService = service;

    const buildStatus = service.status?.build?.status ?? service.buildStatus;
    const deploy = service.status?.deployment?.status ?? service.deploymentStatus?.status;
    const deployedSha = (service as { deployedSHA?: string }).deployedSHA;
    const phase = resolveServicePhase(service);
    const label = buildStatus && deploy && buildStatus !== deploy
      ? `${buildStatus} (deploy: ${deploy})`
      : buildStatus ?? phase;

    if (label !== last) {
      console.log(`${serviceId}: ${label}`);
      last = label;
    }

    const deployReady = deploy && DEPLOY_READY_STATUSES.has(deploy);
    const buildDone = !buildStatus || BUILD_DONE_STATUSES.has(buildStatus);

    // If we have a target SHA, check if it's deployed
    if (targetSha && deployReady) {
      const shaMatch = deployedSha?.toLowerCase().startsWith(targetSha.toLowerCase().slice(0, 7));
      if (shaMatch) {
        console.log(`${serviceId}: SHA ${targetSha.slice(0, 12)}... deployed ✅`);
        return;
      }
    }

    // If build failed but deployment is RUNNING/COMPLETED, the old deployment is still live
    // Don't fail - we can still serve traffic with the previous image
    if (BUILD_FAILURE_STATUSES.has(buildStatus ?? '')) {
      if (deployReady) {
        console.log(`${serviceId}: build failed (${buildStatus}) but deployment is healthy (${deploy}) - using previous image`);
        return;
      }
      console.error(`${serviceId} build failed (${buildStatus}) and deployment not ready (${deploy})`);
      await printFailureDiagnostics(projectId, serviceId, undefined, service);
      process.exit(1);
    }

    if (buildDone && deployReady) {
      // If no target SHA, just check build and deploy are done
      if (!targetSha) {
        console.log(`${serviceId}: build=${buildStatus} deploy=${deploy} ✅`);
        return;
      }
      // If target SHA but doesn't match yet, keep waiting
    }

    if (DEPLOY_FAILURE_STATUSES.has(deploy ?? '')) {
      console.error(`${serviceId} deployment failed (${deploy})`);
      await printFailureDiagnostics(projectId, serviceId, undefined, service);
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  console.error(`${serviceId} did not settle within ${timeoutMs}ms`);
  if (lastService) {
    await printFailureDiagnostics(projectId, serviceId, undefined, lastService);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
