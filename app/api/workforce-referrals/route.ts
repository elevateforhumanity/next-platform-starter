// PUBLIC ROUTE (POST): agency staff submit referrals without auth
// Authenticated GET/PATCH require admin or staff role.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

// GET /api/workforce-referrals?applicant_id=&agency=&status=
async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = req.nextUrl;
  const applicant_id = searchParams.get('applicant_id');
  const agency = searchParams.get('agency');
  const status = searchParams.get('status');

  let query = db
    .from('workforce_referrals')
    .select('*')
    .order('created_at', { ascending: false });

  if (applicant_id) query = query.eq('applicant_id', applicant_id);
  if (agency) query = query.eq('agency', agency);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch referrals');
  return NextResponse.json({ referrals: data });
}

// POST /api/workforce-referrals
// Body: { applicant_name, applicant_email, applicant_phone?, agency, case_manager_name?, case_manager_email?, case_manager_phone?, program_interest?, notes? }
async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { applicant_name, applicant_email, agency } = body;
  if (!applicant_name?.trim() || !applicant_email?.trim() || !agency?.trim()) {
    return safeError('applicant_name, applicant_email, and agency are required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Look up existing application by email to link the referral
  const { data: existingApp } = await db
    .from('applications')
    .select('id')
    .eq('email', applicant_email.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from('workforce_referrals')
    .insert({
      applicant_name: applicant_name.trim(),
      applicant_email: applicant_email.trim().toLowerCase(),
      applicant_phone: body.applicant_phone?.trim() || null,
      agency: agency.trim(),
      case_manager_name: body.case_manager_name?.trim() || null,
      case_manager_email: body.case_manager_email?.trim() || null,
      case_manager_phone: body.case_manager_phone?.trim() || null,
      program_interest: body.program_interest?.trim() || null,
      notes: body.notes?.trim() || null,
      status: 'referred',
      application_id: existingApp?.id ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to create referral');

  // If we found an existing application, tag it with the referral source
  if (existingApp?.id) {
    await db
      .from('applications')
      .update({ referral_agency: agency.trim() })
      .eq('id', existingApp.id)
      .then(({ error: e }) => {
        if (e) logger.warn('[workforce-referrals] Failed to tag application', e.message);
      });
  }

  logger.info('[workforce-referrals] Referral created', { id: data?.id, agency });
  return NextResponse.json({ success: true, id: data?.id }, { status: 201 });
}

// PATCH /api/workforce-referrals
// Body: { id, status, notes? }
// Valid statuses: referred → contacted → enrolled → declined → exited
async function _PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { id, status } = body;
  if (!id || !status) return safeError('id and status are required', 400);

  const VALID_STATUSES = ['referred', 'contacted', 'enrolled', 'declined', 'exited'];
  if (!VALID_STATUSES.includes(status)) {
    return safeError(`status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { error } = await db
    .from('workforce_referrals')
    .update({
      status,
      ...(body.notes ? { notes: body.notes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return safeDbError(error, 'Failed to update referral');
  return NextResponse.json({ success: true });
}

export const GET = withApiAudit(_GET, { action: 'api:get:/api/workforce-referrals' });
export const POST = withApiAudit(_POST, { action: 'api:post:/api/workforce-referrals' });
export const PATCH = withApiAudit(_PATCH, { action: 'api:patch:/api/workforce-referrals' });
