/**
 * POST /api/admin/env-vars/deploy
 *
 * Triggers a production redeploy via AWS CodeBuild.
 * Required when NEXT_PUBLIC_ keys are changed — those are inlined at build time.
 * Triggers both LMS and Admin builds in parallel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const region       = process.env.AWS_REGION              ?? 'us-east-1';
  const lmsProject   = process.env.CODEBUILD_LMS_PROJECT   ?? 'elevate-lms-build';
  const adminProject = process.env.CODEBUILD_ADMIN_PROJECT ?? 'elevate-admin-build';
  const client       = new CodeBuildClient({ region });

  try {
    const [lmsResult, adminResult] = await Promise.allSettled([
      client.send(new StartBuildCommand({ projectName: lmsProject })),
      client.send(new StartBuildCommand({ projectName: adminProject })),
    ]);

    const lms   = lmsResult.status   === 'fulfilled' ? { buildId: lmsResult.value.build?.id,   status: lmsResult.value.build?.buildStatus }   : { error: String((lmsResult as PromiseRejectedResult).reason) };
    const admin = adminResult.status === 'fulfilled' ? { buildId: adminResult.value.build?.id, status: adminResult.value.build?.buildStatus } : { error: String((adminResult as PromiseRejectedResult).reason) };

    const triggered = lmsResult.status === 'fulfilled' || adminResult.status === 'fulfilled';
    logger.info('[env-vars/deploy] CodeBuild triggered', { userId: auth.id, lms, admin });
    return NextResponse.json({ triggered, lms, admin });
  } catch (err) {
    return safeInternalError(err, 'Deploy trigger failed');
  }
}
