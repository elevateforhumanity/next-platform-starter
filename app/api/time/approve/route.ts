import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Action = 'APPROVE' | 'REJECT' | 'LOCK';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return jsonError('Unauthorized', 401);

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role as string | undefined;
  const allowedRoles = ['admin', 'super_admin', 'employer', 'supervisor', 'staff'];
  if (!role || !allowedRoles.includes(role)) {
    return jsonError('Forbidden', 403);
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'SUBMITTED';
  const funding_phase = searchParams.get('funding_phase');
  const hour_type = searchParams.get('hour_type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const userEmail = user.email;

  // Find program holders where this user is the mentor
  const { data: programHolders } = await supabase
    .from('program_holders')
    .select('id')
    .eq('email', userEmail);

  if (!programHolders || programHolders.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  const holderIds = programHolders.map((ph) => ph.id);

  // Query consolidated hour_entries
  let q = supabase
    .from('hour_entries')
    .select(
      `
      id,
      apprentice_application_id,
      work_date,
      hours_claimed,
      accepted_hours,
      source_type,
      category,
      status,
      notes,
      entered_by_email,
      entered_at,
      approved_at,
      approved_by,
      user_id
    `,
    )
    .eq('status', status.toLowerCase())
    .order('work_date', { ascending: false });

  if (hour_type) {
    const mapped =
      hour_type === 'RTI' ? 'rti' : hour_type === 'OJT' ? 'ojt' : hour_type.toLowerCase();
    q = q.eq('source_type', mapped);
  }
  if (from) q = q.gte('work_date', from);
  if (to) q = q.lte('work_date', to);

  const { data, error } = await q;
  if (error) {
    logger.error('[time approve] GET failed', error);
    return jsonError('Unable to load time entries', 500);
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return jsonError('Unauthorized', 401);

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role as string | undefined;
  const allowedRoles = ['admin', 'super_admin', 'employer', 'supervisor', 'staff'];
  if (!role || !allowedRoles.includes(role)) {
    return jsonError('Forbidden', 403);
  }

  const body = await req.json();
  const action = body.action as Action;
  const entry_id = body.entry_id as string;
  const note = (body.note as string | undefined) ?? null;

  if (!entry_id) return jsonError('entry_id required');
  if (!['APPROVE', 'REJECT', 'LOCK'].includes(action)) return jsonError('Invalid action');

  // Fetch entry + status + user_id first
  const { data: entry, error: readErr } = await supabase
    .from('hour_entries')
    .select('id,status,user_id')
    .eq('id', entry_id)
    .maybeSingle();

  if (readErr) {
    logger.error('[time approve] read failed', readErr);
    return jsonError('Unable to approve time entry', 500);
  }
  if (!entry) return jsonError('Entry not found', 404);

  // Prevent learner from approving their own hours
  if (entry.user_id === user.id) {
    return jsonError('Cannot approve your own time entries', 403);
  }

  if (entry.status === 'locked') return jsonError('Entry is locked and cannot be modified', 409);

  // Business rules:
  // - Approve/Reject only when pending
  // - Lock only when approved
  if (action === 'APPROVE' || action === 'REJECT') {
    if (entry.status !== 'pending')
      return jsonError('Only pending entries can be approved/rejected', 409);
  }
  if (action === 'LOCK') {
    if (entry.status !== 'approved') return jsonError('Only approved entries can be locked', 409);
  }

  const nextStatus =
    action === 'APPROVE' ? 'approved' : action === 'REJECT' ? 'rejected' : 'locked';

  const patch: Record<string, any> = {
    status: nextStatus,
    approved_by: user.email,
    approved_at: new Date().toISOString(),
  };

  if (action === 'REJECT' && note) {
    patch.rejection_reason = note;
  }

  const { data: updated, error: updErr } = await supabase
    .from('hour_entries')
    .update(patch)
    .eq('id', entry_id)
    .select('*')
    .single();

  if (updErr) {
    logger.error('[time approve] update failed', updErr);
    return jsonError('Unable to approve time entry', 500);
  }

  // Audit log: hours action
  const auditAction =
    action === 'APPROVE'
      ? AuditAction.HOURS_APPROVED
      : action === 'REJECT'
        ? AuditAction.HOURS_REJECTED
        : AuditAction.HOURS_VERIFIED;

  await auditLog({
    actorId: user.id,
    actorRole: role,
    action: auditAction,
    entity: AuditEntity.HOURS,
    entityId: entry_id,
    metadata: {
      previous_status: entry.status,
      new_status: nextStatus,
      minutes: updated?.minutes,
      enrollment_id: updated?.enrollment_id,
    },
  });

  return NextResponse.json({ ok: true, entry: updated });
}
