import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { autoEnroll } from '@/lib/enrollment/auto-enroll';
import type { SalonHostShopProgramType } from '@/lib/partners/submit-salon-host-shop-application';
import { COSMETOLOGY_PROGRAM_ID, COSMETOLOGY_COURSE_ID } from '@/lib/cosmetology/pricing';

type MouInput = {
  salon_name: string;
  signer_name: string;
  signer_title?: string;
  supervisor_name?: string;
  supervisor_license?: string;
  compensation_model?: string;
  compensation_rate?: string;
  signature_data: string;
  signed_at?: string;
  mou_version?: string;
};

const ENROLLMENT_BY_TYPE: Record<
  SalonHostShopProgramType,
  {
    programId: string;
    programSlug: string;
    programName: string;
    courseId: string;
    partnerType: string;
    mouVersion: string;
  }
> = {
  cosmetology: {
    programId: COSMETOLOGY_PROGRAM_ID,
    programSlug: 'cosmetology-apprenticeship',
    programName: 'Cosmetology Apprenticeship',
    courseId: COSMETOLOGY_COURSE_ID,
    partnerType: 'cosmetology',
    mouVersion: '2025-cosmetology-01',
  },
  nail_technician: {
    programId: COSMETOLOGY_PROGRAM_ID,
    programSlug: 'nail-technician-apprenticeship',
    programName: 'Nail Technician Apprenticeship',
    courseId: COSMETOLOGY_COURSE_ID,
    partnerType: 'nail_technician',
    mouVersion: '2025-nail-technician-01',
  },
  esthetician: {
    programId: COSMETOLOGY_PROGRAM_ID,
    programSlug: 'esthetician-apprenticeship',
    programName: 'Esthetician Apprenticeship',
    courseId: COSMETOLOGY_COURSE_ID,
    partnerType: 'esthetician',
    mouVersion: '2025-esthetician-01',
  },
};

export async function signSalonHostShopMou(
  db: SupabaseClient,
  programType: SalonHostShopProgramType,
  userEmail: string,
  userId: string,
  input: MouInput,
): Promise<{ enrollmentId: string | null }> {
  const cfg = ENROLLMENT_BY_TYPE[programType];
  const signedAt = input.signed_at ?? new Date().toISOString();

  const { data: partner, error: partnerErr } = await db
    .from('partners')
    .select('id, name')
    .eq('contact_email', userEmail)
    .eq('program_type', programType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (partnerErr) throw partnerErr;
  if (!partner) {
    const err = new Error('NO_PARTNER');
    throw err;
  }

  const { error: sigErr } = await db.from('mou_signatures').insert({
    user_id: userId,
    organization_name: input.salon_name,
    contact_name: input.signer_name,
    contact_title: input.signer_title ?? '',
    contact_email: userEmail,
    signer_name: input.signer_name,
    signer_title: input.signer_title ?? '',
    supervisor_name: input.supervisor_name ?? '',
    supervisor_license: input.supervisor_license ?? '',
    compensation_model: input.compensation_model ?? '',
    compensation_rate: input.compensation_rate ?? '',
    digital_signature: input.signature_data,
    signature_data: input.signature_data,
    agreed: true,
    agreed_at: signedAt,
    signed_at: signedAt,
    mou_version: input.mou_version ?? cfg.mouVersion,
    partner_type: cfg.partnerType,
  });

  if (sigErr) throw sigErr;

  await db
    .from('partners')
    .update({ mou_signed: true, mou_signed_at: signedAt })
    .eq('id', partner.id);

  const enrollResult = await autoEnroll({
    db,
    email: userEmail,
    fullName: input.signer_name,
    programId: cfg.programId,
    programSlug: cfg.programSlug,
    programName: cfg.programName,
    courseId: cfg.courseId,
    partnerId: partner.id,
    fundingSource: 'waived',
  });

  if (enrollResult.error) {
    logger.warn('Salon host MOU auto-enrollment failed (non-fatal)', {
      programType,
      error: enrollResult.error,
      partnerId: partner.id,
    });
  }

  logger.info(`Salon host MOU signed (${programType}): partner ${partner.id}`);
  return { enrollmentId: enrollResult.enrollmentId ?? null };
}
