/**
 * Workflow Engine
 *
 * Executes a workflow by running its steps in order.
 * Called from the manual-trigger API and (future) event listener.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { emitEvent } from '@/lib/platform/events';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import type { WorkflowStep, RunStatus } from './types';

interface RunContext {
  workflowId: string;
  runId: string;
  triggerPayload: Record<string, unknown>;
}

// ── Step executors ────────────────────────────────────────────────────────────

async function execSendNotification(
  config: Record<string, unknown>,
  ctx: RunContext,
): Promise<{ ok: boolean; output: Record<string, unknown> }> {
  const db = createAdminClient();
  const { error } = await db.from('notifications').insert({
    user_id: config.user_id ?? null,
    title: config.title ?? 'Workflow Notification',
    message: config.message ?? '',
    type: config.type ?? 'info',
    metadata: { workflow_id: ctx.workflowId, run_id: ctx.runId, ...ctx.triggerPayload },
  });
  return { ok: !error, output: error ? { error: error.message } : { inserted: true } };
}

async function execEmitEvent(
  config: Record<string, unknown>,
  ctx: RunContext,
): Promise<{ ok: boolean; output: Record<string, unknown> }> {
  await emitEvent(
    (config.event_type as string) ?? 'workflow.action',
    (config.category as any) ?? 'system',
    {
      severity: (config.severity as any) ?? 'info',
      actor_type: 'system',
      subject_id: ctx.runId,
      subject_type: 'workflow_run',
      payload: { workflow_id: ctx.workflowId, ...ctx.triggerPayload },
      message: (config.message as string) ?? undefined,
    },
  );
  return { ok: true, output: { emitted: config.event_type } };
}

async function execWebhookCall(
  config: Record<string, unknown>,
): Promise<{ ok: boolean; output: Record<string, unknown> }> {
  const url = config.url as string;
  if (!url) return { ok: false, output: { error: 'No URL configured' } };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.body ?? {}),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, output: { status: res.status } };
  } catch (err: any) {
    return { ok: false, output: { error: err.message } };
  }
}

async function execSendEmail(
  config: Record<string, unknown>,
  ctx: RunContext,
): Promise<{ ok: boolean; output: Record<string, unknown> }> {
  const to = config.to as string | string[] | undefined;
  const subject = config.subject as string | undefined;
  const html = config.html as string | undefined;

  if (!to || !subject || !html) {
    return { ok: false, output: { error: 'send_email requires to, subject, and html in action_config' } };
  }

  // Interpolate {{key}} placeholders from triggerPayload
  const interpolate = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(ctx.triggerPayload[k] ?? ''));

  const resolvedTo = Array.isArray(to) ? to.map(interpolate) : interpolate(to);
  const resolvedSubject = interpolate(subject);
  const resolvedHtml = interpolate(html);

  try {
    const ok = await sendEmail({ to: resolvedTo, subject: resolvedSubject, html: resolvedHtml });
    return { ok, output: { to: resolvedTo, subject: resolvedSubject } };
  } catch (err: any) {
    return { ok: false, output: { error: err.message } };
  }
}

/**
 * Condition step — evaluates a simple dot-path expression against triggerPayload.
 * condition_expr format: "field operator value"
 * Supported operators: == != > < >= <=
 * Example: "severity == critical"  |  "deficit > 40"
 * Returns ok=false (halts workflow) when condition fails.
 */
function execCondition(
  config: Record<string, unknown>,
  conditionExpr: string | null,
  ctx: RunContext,
): { ok: boolean; output: Record<string, unknown> } {
  const expr = (config.condition_expr as string | undefined) ?? conditionExpr;
  if (!expr) return { ok: true, output: { condition: 'passed', reason: 'no expression' } };

  const match = expr.trim().match(/^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (!match) return { ok: true, output: { condition: 'passed', reason: 'unparseable expression' } };

  const [, path, op, rawExpected] = match;
  const expected = rawExpected.trim().replace(/^["']|["']$/g, '');

  // Resolve dot-path from triggerPayload
  const actual = path.split('.').reduce<unknown>((obj, key) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
    return undefined;
  }, ctx.triggerPayload as unknown);

  const actualStr = String(actual ?? '');
  const actualNum = parseFloat(actualStr);
  const expectedNum = parseFloat(expected);

  let passed: boolean;
  switch (op) {
    case '==': passed = actualStr === expected; break;
    case '!=': passed = actualStr !== expected; break;
    case '>':  passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum; break;
    case '<':  passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum; break;
    case '>=': passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum; break;
    case '<=': passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum; break;
    default:   passed = true;
  }

  return {
    ok: passed,
    output: { condition: passed ? 'passed' : 'failed', expr, actual: actualStr, expected },
  };
}

async function execStep(
  step: WorkflowStep,
  ctx: RunContext,
): Promise<{ ok: boolean; output: Record<string, unknown> }> {
  switch (step.action_type) {
    case 'send_notification':
      return execSendNotification(step.action_config, ctx);
    case 'emit_event':
      return execEmitEvent(step.action_config, ctx);
    case 'webhook_call':
      return execWebhookCall(step.action_config);
    case 'send_email':
      return execSendEmail(step.action_config, ctx);
    case 'condition':
      return execCondition(step.action_config, step.condition_expr ?? null, ctx);
    default:
      return { ok: true, output: { note: `action ${step.action_type} not yet implemented` } };
  }
}

// ── Main executor ─────────────────────────────────────────────────────────────

export async function executeWorkflow(
  workflowId: string,
  triggeredBy: 'manual' | 'event' | 'schedule' | 'webhook',
  triggerPayload: Record<string, unknown> = {},
  triggerId?: string,
): Promise<{ runId: string; status: RunStatus; stepsRun: number; error?: string }> {
  const db = createAdminClient();

  // Load steps
  const { data: steps, error: stepsErr } = await db
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('enabled', true)
    .order('step_order', { ascending: true });

  if (stepsErr) {
    logger.error('[workflow/engine] failed to load steps', { workflowId, error: stepsErr.message });
    return { runId: '', status: 'failed', stepsRun: 0, error: stepsErr.message };
  }

  // Create run record
  const { data: run, error: runErr } = await db
    .from('workflow_runs')
    .insert({
      workflow_id: workflowId,
      trigger_id: triggerId ?? null,
      status: 'running',
      triggered_by: triggeredBy,
      trigger_payload: triggerPayload,
      steps_total: (steps ?? []).length,
      steps_done: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (runErr || !run) {
    logger.error('[workflow/engine] failed to create run', { workflowId, error: runErr?.message });
    return { runId: '', status: 'failed', stepsRun: 0, error: runErr?.message };
  }

  const runId = run.id;
  const ctx: RunContext = { workflowId, runId, triggerPayload };
  let stepsDone = 0;
  let finalStatus: RunStatus = 'success';
  let errorMessage: string | undefined;

  for (const step of steps ?? []) {
    const t0 = Date.now();
    let stepStatus: RunStatus = 'running';
    let output: Record<string, unknown> = {};
    let stepError: string | undefined;

    try {
      const result = await execStep(step as WorkflowStep, ctx);
      stepStatus = result.ok ? 'success' : 'failed';
      output = result.output;
      if (!result.ok) {
        stepError = (result.output.error as string) ?? 'Step failed';
        finalStatus = 'failed';
        errorMessage = stepError;
      }
    } catch (err: any) {
      stepStatus = 'failed';
      stepError = err.message;
      finalStatus = 'failed';
      errorMessage = err.message;
    }

    const duration = Date.now() - t0;
    stepsDone++;

    await db.from('workflow_step_logs').insert({
      run_id: runId,
      step_id: step.id,
      step_order: step.step_order,
      action_type: step.action_type,
      status: stepStatus,
      output,
      error_message: stepError ?? null,
      duration_ms: duration,
    });

    // Update run progress
    await db
      .from('workflow_runs')
      .update({ steps_done: stepsDone })
      .eq('id', runId);

    // Stop on first failure
    if (finalStatus === 'failed') break;
  }

  // Finalize run
  await db
    .from('workflow_runs')
    .update({
      status: finalStatus,
      steps_done: stepsDone,
      completed_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
    })
    .eq('id', runId);

  // Update workflow aggregate stats (increment run_count via raw SQL to avoid race)
  await db.rpc('exec_sql' as any, {
    sql: `UPDATE workflows SET run_count = COALESCE(run_count,0)+1, last_run_at = now(), last_run_status = '${finalStatus}' WHERE id = '${workflowId}'`,
  }).catch(() => null);

  return { runId, status: finalStatus, stepsRun: stepsDone };
}
