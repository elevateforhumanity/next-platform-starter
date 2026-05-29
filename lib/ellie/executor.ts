/**
 * Ellie action executor.
 *
 * Each handler receives the action params and a Supabase admin client.
 * Returns { success, message, data? }.
 * Throws on unrecoverable errors — the caller writes to audit_logs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EllieActionType } from './actions';

export interface ExecuteResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

type Params = Record<string, unknown>;

// ── Individual handlers ───────────────────────────────────────────────────────

async function sendReminder(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const userIds = (params.userIds as string[]) ?? (params.userId ? [params.userId as string] : []);
  if (!userIds.length) return { success: false, message: 'No user IDs provided.' };

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (!profiles?.length) return { success: false, message: 'No matching profiles found.' };

  // Insert delivery_logs rows — the existing email automation picks these up
  const rows = profiles.map((p: { id: string; full_name: string; email: string }) => ({
    channel: 'email',
    template_name: 'ellie_reminder',
    recipient: p.email,
    recipient_name: p.full_name,
    status: 'queued',
    metadata: { triggered_by: 'ellie', message: params.message ?? 'You have been sent a reminder from your program coordinator.' },
  }));

  const { error } = await db.from('delivery_logs').insert(rows);
  if (error) throw new Error(`Failed to queue reminders: ${error.message}`);

  return {
    success: true,
    message: `${profiles.length} reminder${profiles.length !== 1 ? 's' : ''} queued for delivery.`,
    data: { count: profiles.length, recipients: profiles.map((p: { full_name: string }) => p.full_name) },
  };
}

async function flagAtRisk(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const enrollmentIds = (params.enrollmentIds as string[]) ?? (params.enrollmentId ? [params.enrollmentId as string] : []);
  if (!enrollmentIds.length) return { success: false, message: 'No enrollment IDs provided.' };

  const { error, count } = await db
    .from('program_enrollments')
    .update({ status: 'at_risk', at_risk_reason: params.reason ?? 'Flagged by Ellie', at_risk_flagged_at: new Date().toISOString() })
    .in('id', enrollmentIds)
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error(`Failed to flag enrollments: ${error.message}`);
  return { success: true, message: `${count ?? enrollmentIds.length} enrollment(s) flagged as at-risk.` };
}

async function unflagAtRisk(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const enrollmentIds = (params.enrollmentIds as string[]) ?? (params.enrollmentId ? [params.enrollmentId as string] : []);
  if (!enrollmentIds.length) return { success: false, message: 'No enrollment IDs provided.' };

  const { error, count } = await db
    .from('program_enrollments')
    .update({ status: 'active', at_risk_reason: null, at_risk_flagged_at: null })
    .in('id', enrollmentIds)
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error(`Failed to clear at-risk flags: ${error.message}`);
  return { success: true, message: `${count ?? enrollmentIds.length} enrollment(s) cleared.` };
}

async function approveApplication(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { applicationId, studentName } = params as { applicationId: string; studentName?: string };
  if (!applicationId) return { success: false, message: 'No application ID provided.' };

  const { error } = await db
    .from('applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) throw new Error(`Failed to approve application: ${error.message}`);
  return { success: true, message: `Application for ${studentName ?? applicationId} approved.` };
}

async function rejectApplication(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { applicationId, studentName, reason } = params as { applicationId: string; studentName?: string; reason?: string };
  if (!applicationId) return { success: false, message: 'No application ID provided.' };

  const { error } = await db
    .from('applications')
    .update({ status: 'rejected', rejection_reason: reason ?? 'Rejected via Ellie', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) throw new Error(`Failed to reject application: ${error.message}`);
  return { success: true, message: `Application for ${studentName ?? applicationId} rejected.` };
}

async function approveProgramHolder(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { programHolderId, orgName } = params as { programHolderId: string; orgName?: string };
  if (!programHolderId) return { success: false, message: 'No program holder ID provided.' };

  const { error } = await db
    .from('program_holder_profiles')
    .update({ status: 'active', approved_at: new Date().toISOString() })
    .eq('id', programHolderId);

  if (error) throw new Error(`Failed to approve program holder: ${error.message}`);
  return { success: true, message: `Program holder ${orgName ?? programHolderId} approved and activated.` };
}

async function rejectProgramHolder(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { programHolderId, orgName, reason } = params as { programHolderId: string; orgName?: string; reason?: string };
  if (!programHolderId) return { success: false, message: 'No program holder ID provided.' };

  const { error } = await db
    .from('program_holder_profiles')
    .update({ status: 'rejected', rejection_reason: reason ?? 'Rejected via Ellie', reviewed_at: new Date().toISOString() })
    .eq('id', programHolderId);

  if (error) throw new Error(`Failed to reject program holder: ${error.message}`);
  return { success: true, message: `Program holder ${orgName ?? programHolderId} rejected.` };
}

async function issueCertificate(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { enrollmentId, studentName } = params as { enrollmentId: string; studentName?: string };
  if (!enrollmentId) return { success: false, message: 'No enrollment ID provided.' };

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('user_id, program_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) return { success: false, message: 'Enrollment not found.' };

  const { error } = await db.from('program_completion_certificates').insert({
    user_id: enrollment.user_id,
    program_id: enrollment.program_id,
    enrollment_id: enrollmentId,
    issued_at: new Date().toISOString(),
    issued_by: 'ellie',
  });

  if (error) throw new Error(`Failed to issue certificate: ${error.message}`);
  return { success: true, message: `Certificate issued for ${studentName ?? enrollmentId}.` };
}

async function sendMagicLink(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { email, name } = params as { email: string; name?: string };
  if (!email) return { success: false, message: 'No email provided.' };

  // Queue via delivery_logs — the email worker handles OTP generation
  const { error } = await db.from('delivery_logs').insert({
    channel: 'email',
    template_name: 'magic_link',
    recipient: email,
    recipient_name: name ?? email,
    status: 'queued',
    metadata: { triggered_by: 'ellie' },
  });

  if (error) throw new Error(`Failed to queue magic link: ${error.message}`);
  return { success: true, message: `Magic link queued for ${name ?? email}.` };
}

async function runWorkflow(params: Params, db: SupabaseClient): Promise<ExecuteResult> {
  const { workflowId, workflowName } = params as { workflowId: string; workflowName?: string };
  if (!workflowId) return { success: false, message: 'No workflow ID provided.' };

  const { error } = await db.from('workflow_runs').insert({
    workflow_id: workflowId,
    status: 'pending',
    triggered_by: 'ellie',
    started_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to trigger workflow: ${error.message}`);
  return { success: true, message: `Workflow "${workflowName ?? workflowId}" triggered.` };
}

// navigate is client-side only — executor is a no-op
async function navigate(params: Params): Promise<ExecuteResult> {
  return { success: true, message: `Navigate to ${params.url}`, data: { url: params.url as string } };
}

// ── Dispatch table ────────────────────────────────────────────────────────────

const HANDLERS: Record<EllieActionType, (params: Params, db: SupabaseClient) => Promise<ExecuteResult>> = {
  send_reminder:          sendReminder,
  flag_at_risk:           flagAtRisk,
  unflag_at_risk:         unflagAtRisk,
  approve_application:    approveApplication,
  reject_application:     rejectApplication,
  approve_program_holder: approveProgramHolder,
  reject_program_holder:  rejectProgramHolder,
  issue_certificate:      issueCertificate,
  send_magic_link:        sendMagicLink,
  assign_case_manager:    async () => ({ success: false, message: 'assign_case_manager not yet implemented.' }),
  schedule_exam:          async () => ({ success: false, message: 'schedule_exam not yet implemented.' }),
  cancel_exam:            async () => ({ success: false, message: 'cancel_exam not yet implemented.' }),
  run_workflow:           runWorkflow,
  navigate,
};

export async function executeEllieAction(
  actionType: EllieActionType,
  params: Params,
  db: SupabaseClient,
): Promise<ExecuteResult> {
  const handler = HANDLERS[actionType];
  if (!handler) return { success: false, message: `Unknown action type: ${actionType}` };
  return handler(params, db);
}
