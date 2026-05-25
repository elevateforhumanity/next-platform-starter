/**
 * POST /api/admin/env-vars/deploy
 *
 * Triggers a force-new-deployment on the ECS services so updated SSM secrets
 * are picked up without a full image rebuild.
 *
 * For NEXT_PUBLIC_ key changes a full GitHub Actions deploy is still required
 * (those are inlined at build time). For server-only secrets, ECS force-deploy
 * is sufficient.
 *
 * Required IAM: ecs:UpdateService on the elevate-cluster services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

const ECS_CLUSTER  = process.env.ECS_CLUSTER  || 'elevate-cluster';
const ECS_SERVICES = (process.env.ECS_SERVICES || 'elevate-lms,elevate-admin')
  .split(',')
  .map((s) => s.trim());
const AWS_REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKey || !secretKey) {
    return NextResponse.json(
      {
        triggered: false,
        reason: 'AWS credentials not configured (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)',
      },
      { status: 503 },
    );
  }

  const results: { service: string; status: string }[] = [];

  for (const service of ECS_SERVICES) {
    try {
      const { execSync } = await import('child_process');
      execSync(
        `aws ecs update-service --cluster ${ECS_CLUSTER} --service ${service} ` +
          `--force-new-deployment --region ${AWS_REGION} --output json`,
        {
          stdio: 'pipe',
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: accessKey,
            AWS_SECRET_ACCESS_KEY: secretKey,
            AWS_DEFAULT_REGION: AWS_REGION,
          },
        },
      );
      logger.info('[env-vars/deploy] ECS force-deploy triggered', { service, userId: auth.id });
      results.push({ service, status: 'triggered' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('[env-vars/deploy] ECS update-service failed', { service, error: msg });
      results.push({ service, status: `failed: ${msg.slice(0, 120)}` });
    }
  }

  const allOk = results.every((r) => r.status === 'triggered');
  return NextResponse.json({ triggered: allOk, results }, { status: allOk ? 200 : 502 });
}
