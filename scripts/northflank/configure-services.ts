#!/usr/bin/env tsx
/**
 * Configure Northflank combined services for the Elevate production split.
 *
 * Applies:
 *   - Dockerfile paths for LMS and Admin
 *   - BuildKit registry cache
 *   - runtime defaults
 *   - lightweight /api/ping readiness probes
 *
 * Usage:
 *   pnpm tsx scripts/northflank/configure-services.ts --dry-run
 *   pnpm tsx scripts/northflank/configure-services.ts --execute
 */

import { combinedServicePath, nfFetch, resolveAdminServiceId, resolveLmsServiceId, resolveProjectId } from './lib';

const SERVICES = [
  {
    id: process.env.NORTHFLANK_LMS_SERVICE_ID || resolveLmsServiceId() || 'elevate-lms',
    dockerfile: '/Dockerfile.northflank-lms',
    runtimeEnvironment: {
      SERVICE_ROLE: 'lms',
      PORT: '8080',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_LMS_URL: 'https://www.elevateforhumanity.org/lms',
    },
  },
  {
    id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || resolveAdminServiceId() || 'elevate-admin',
    dockerfile: '/Dockerfile.northflank-admin',
    runtimeEnvironment: {
      SERVICE_ROLE: 'admin',
      PORT: '8080',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_LMS_URL: 'https://www.elevateforhumanity.org/lms',
    },
  },
];

const BUILDKIT = {
  useCache: true,
  cacheStorageSize: 10240,
};

const billing = {
  deploymentPlan: process.env.NORTHFLANK_DEPLOYMENT_PLAN || 'nf-compute-100-2',
  buildPlan: process.env.NORTHFLANK_BUILD_PLAN || 'nf-compute-800-32',
};

const ephemeralStorageSize = Number(process.env.NORTHFLANK_EPHEMERAL_STORAGE_MB || 32768);

const healthChecks = [
  {
    protocol: 'HTTP',
    type: 'readinessProbe',
    path: '/api/ping',
    port: 8080,
    initialDelaySeconds: 30,
    periodSeconds: 10,
    timeoutSeconds: 5,
    failureThreshold: 6,
    successThreshold: 1,
  },
];

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.log(`Project: ${projectId}`);

  for (const service of SERVICES) {
    const patch = {
      billing,
      runtimeEnvironment: service.runtimeEnvironment,
      healthChecks,
      buildSettings: {
        storage: {
          ephemeralStorage: {
            storageSize: ephemeralStorageSize,
          },
        },
        dockerfile: {
          buildEngine: 'buildkit',
          dockerFilePath: service.dockerfile,
          dockerWorkDir: '/',
          buildkit: BUILDKIT,
        },
      },
      buildConfiguration: {
        storage: {
          ephemeralStorage: {
            storageSize: ephemeralStorageSize,
          },
        },
      },
    };

    console.log(
      `${dryRun ? '[dry-run]' : '[patch]'} ${service.id} -> ${service.dockerfile}, build ${billing.buildPlan}, runtime ${billing.deploymentPlan}, health /api/ping`,
    );

    if (!dryRun) {
      await nfFetch(combinedServicePath(projectId, service.id), {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    }
  }

  if (dryRun) {
    console.log('\nRe-run with --execute to apply.');
  } else {
    console.log('\nNorthflank service configuration applied.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
