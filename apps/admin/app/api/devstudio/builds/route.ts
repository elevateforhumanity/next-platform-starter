import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  getNorthflankProjectId,
  getNorthflankServices,
  isNorthflankReady,
  triggerNorthflankBuild,
} from '@/lib/northflank/runtime';
import { createAiTask } from '@/lib/devstudio/os/task-runner';
import { writeDevAuditLog } from '@/lib/devstudio/os/audit';
import type { BuildKind } from '@/lib/devstudio/os/types';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUILD_COMMANDS: Record<BuildKind, string> = {
  lint: 'pnpm lint',
  typecheck: 'pnpm typecheck',
  test: 'pnpm test',
  build: 'pnpm build',
};

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('ai_deployments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

  if (error) return safeError('Failed to fetch Dev Studio builds', 500);
  return NextResponse.json({ builds: data });
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ deployments: data ?? [], commands: BUILD_COMMANDS });
  } catch (err) {
    return safeInternalError(err, 'Failed to load builds');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const db = await requireAdminClient();
  const service = body.service ?? 'admin';

  const { data, error } = await db
    .from('ai_deployments')
    .insert({
      service,
      environment: body.environment ?? 'production',
      status: 'building',
      commit_sha: body.commit_sha ?? null,
      triggered_by: auth.id,
    })
    .select()
    .single();

  if (error) return safeError('Failed to create Dev Studio build record', 500);

  await db.from('dev_audit_logs').insert({
    user_id: auth.id,
    action: 'build_triggered',
    resource_type: 'ai_deployment',
    resource_id: data.id,
    metadata: { service },
  });

  const projectId = getNorthflankProjectId();
  const services = service === 'all'
    ? getNorthflankServices()
    : getNorthflankServices().filter((item) => item.key === service || item.id === service);

  if (!services.length) {
    await db.from('ai_deployments').update({ status: 'failed' }).eq('id', data.id);
    return safeError(`Unknown Northflank service: ${service}`, 400);
  }

  if (!projectId || !isNorthflankReady()) {
    return NextResponse.json(
      {
        build: data,
        triggered: false,
        message: 'Build record created, but Northflank API credentials are not configured.',
      },
      { status: 202 },
    );
  }

  }

  if (!projectId || !isNorthflankReady()) {
    return NextResponse.json(
      {
        build: data,
        triggered: false,
        message: 'Build record created, but Northflank API credentials are not configured.',
      },
      { status: 202 },
    );
  }

  try {
    const northflankBuilds = await Promise.all(
      services.map(async (item) => ({
        service: item.id,
        build: await triggerNorthflankBuild(projectId, item.id),
      })),
    );
    await db.from('ai_deployments').update({ status: 'deploying' }).eq('id', data.id);
    return NextResponse.json(
      { build: { ...data, status: 'deploying' }, triggered: true, northflankBuilds },
      { status: 201 },
    );
  } catch (err) {
    await db.from('ai_deployments').update({ status: 'failed' }).eq('id', data.id);
    return safeInternalError(err, 'Northflank build trigger failed');
  try {
    const body = await request.json().catch(() => ({}));
    const kind = String(body.kind ?? 'lint') as BuildKind;
    if (!BUILD_COMMANDS[kind]) return safeError('Invalid build kind', 400);

    const command = BUILD_COMMANDS[kind];
    const serviceName = body.serviceName ? String(body.serviceName) : 'elevate-lms';
    const db = await requireAdminClient();

    const task = await createAiTask(db, {
      title: `Run ${kind}`,
      description: `Dev Studio build: ${command}`,
      command,
      agentSlug: 'ai-devops',
      requestedBy: auth.id,
    });

    await db
      .from('ai_tasks')
      .update({
        result_json: { kind, command, service: serviceName },
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    const { data: deployment, error: depErr } = await db
      .from('ai_deployments')
      .insert({
        task_id: task.id,
        service_name: serviceName,
        environment: body.environment ? String(body.environment) : 'production',
        status: task.status === 'awaiting_approval' ? 'pending' : 'building',
        metadata: { kind, command },
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (depErr && !isMissingTable(depErr)) {
      throw depErr;
    }

    await writeDevAuditLog(db, {
      actorId: auth.id,
      action: 'build.trigger',
      resourceType: 'ai_tasks',
      resourceId: task.id,
      metadata: { kind, command, serviceName },
    });

    return jsonOk(
      {
        task,
        deployment: deployment ?? null,
        command,
        note: 'Task queued. Run the command in the Studio terminal or approve if required.',
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('ai_')) return tableNotReadyResponse();
    return safeInternalError(err, 'Failed to trigger build');
  }
}
