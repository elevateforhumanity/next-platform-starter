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
  .split(',').map((s) => s.trim());
const AWS_REGION = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

async function ecsUpdateService(service: string): Promise<void> {
  const { ECSClient, UpdateServiceCommand } = await import('@aws-sdk/client-ecs');
  const client = new ECSClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken:    process.env.AWS_SESSION_TOKEN,
    },
  });
  await client.send(new UpdateServiceCommand({
    cluster: ECS_CLUSTER,
    service,
    forceNewDeployment: true,
  }));
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { triggered: false, reason: 'AWS credentials not configured' },
      { status: 503 },
    );
  }

  const results: { service: string; status: string }[] = [];

  for (const service of ECS_SERVICES) {
    try {
      await ecsUpdateService(service);
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
