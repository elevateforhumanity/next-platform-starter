import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { autoEnroll } from '@/lib/enrollment/auto-enroll';
import { BARBER_PROGRAM_ID, BARBER_COURSE_ID } from '@/lib/barber/pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const body = await req.json();
  const {
    shop_name,
    signer_name,
    signer_title,
    supervisor_name,
    supervisor_license,
    compensation_model,
    compensation_rate,
    signature_data,
    signed_at,
    mou_version,
  } = body;

  if (!shop_name || !signer_name || !signature_data) {
    return safeError('shop_name, signer_name, and signature_data are required', 400);
  }

  const db = await requireAdminClient();

  // Find the barbershop partner record for this user
  const { data: partner, error: partnerErr } = await db
    .from('partners')
    .select('id, name')
    .eq('contact_email', user.email ?? '')
    .or('program_type.eq.barber,program_type.is.null')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (partnerErr) return safeInternalError(partnerErr, 'Failed to look up partner record');
  if (!partner) return safeError('No barbershop application found for this account', 404);

  // Write MOU signature record
  const { error: sigErr } = await db.from('mou_signatures').insert({
    user_id: user.id,
    organization_name: shop_name,
    contact_name: signer_name,
    contact_title: signer_title ?? '',
    contact_email: user.email,
    signer_name,
    signer_title: signer_title ?? '',
    supervisor_name: supervisor_name ?? '',
    supervisor_license: supervisor_license ?? '',
    compensation_model: compensation_model ?? '',
    compensation_rate: compensation_rate ?? '',
    digital_signature: signature_data,
    signature_data,
    agreed: true,
    agreed_at: signed_at ?? new Date().toISOString(),
    signed_at: signed_at ?? new Date().toISOString(),
    mou_version: mou_version ?? '2025-barber-01',
    partner_type: 'barber',
  });

  if (sigErr) {
    logger.error('Barbershop MOU signature insert error:', sigErr);
    return safeInternalError(sigErr, 'Failed to record MOU signature');
  }

  // Mark partner record as MOU signed
  const { error: updateErr } = await db
    .from('partners')
    .update({ mou_signed: true, mou_signed_at: signed_at ?? new Date().toISOString() })
    .eq('id', partner.id);

  if (updateErr) {
    logger.error('Barbershop partner mou_signed update error:', updateErr);
    // Non-fatal — signature was recorded
  }

  // MOU signing is the final completion step — auto-enroll the partner contact now
  const enrollResult = await autoEnroll({
    db,
    email: user.email!,
    fullName: signer_name,
    programId: BARBER_PROGRAM_ID,
    programSlug: 'barber-apprenticeship',
    programName: 'Barber Apprenticeship',
    courseId: BARBER_COURSE_ID,
    partnerId: partner.id,
    fundingSource: 'waived',
  });

  if (enrollResult.error) {
    logger.warn('Barbershop partner auto-enrollment failed (non-fatal)', { error: enrollResult.error, partnerId: partner.id });
  } else {
    logger.info(`Barbershop partner enrolled: partner ${partner.id} — enrollment ${enrollResult.enrollmentId}`);
  }

  logger.info(`Barbershop MOU signed: partner ${partner.id} — ${shop_name}`);
  return NextResponse.json({ success: true, enrollmentId: enrollResult.enrollmentId ?? null }, { status: 200 });
}
