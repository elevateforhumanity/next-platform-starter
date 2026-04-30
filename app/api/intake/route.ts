// PUBLIC ROUTE: public intake form
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  sendApplicationConfirmation,
  sendAdminApplicationNotification,
} from '@/lib/notifications/application-emails';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Auto-tag funding eligibility based on intake answers.
// Priority: JRI > self-pay > WIOA categorical > WIOA income > WIOA workforce > pending-review
function determineFundingTag(body: Record<string, string | string[]>): string {
  if (body.probation_or_reentry === 'true') return 'jri';
  if (body.funding_needed === 'false') return 'self-pay';
  // WIOA categorical eligibility: SNAP or TANF receipt
  if (body.snap_recipient === 'true' || body.tanf_recipient === 'true') return 'wioa-categorical';
  // WIOA income eligibility: low-income household
  const incomeRange = typeof body.annual_income === 'string' ? body.annual_income : '';
  if (incomeRange === '0-15000' || incomeRange === '15000-25000') return 'wioa-income';
  // WIOA via workforce partner connection
  if (body.workforce_connection === 'workone' || body.workforce_connection === 'employer-indy')
    return 'wioa';
  return 'pending-review';
}

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await requireAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let body: Record<string, string | string[]>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  const fundingTag = determineFundingTag(body);

  // Return undefined instead of null to avoid NOT NULL constraint issues
  // if columns are tightened later. Supabase-js omits undefined fields.
  function clean(v: string | undefined | null, max = 200): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    if (!s) return undefined;
    return s.slice(0, max);
  }

  // Barriers arrive as a string (single value) or string[] (multiple checkboxes)
  const barriersRaw = body.barriers;
  const barriers: string[] = Array.isArray(barriersRaw)
    ? barriersRaw
    : barriersRaw
      ? [barriersRaw as string]
      : [];

  const { error } = await supabase.from('apprenticeship_intake').insert([
    {
      full_name: (body.full_name as string).trim(),
      email: clean(body.email as string),
      phone: clean(body.phone as string),
      city: clean(body.city as string),
      state: clean(body.state as string) || 'IN',
      county: clean(body.county as string),
      date_of_birth: clean(body.date_of_birth as string) || null,
      program_interest: clean(body.program_interest as string) || 'not-specified',
      employment_status: clean(body.employment_status as string),
      funding_needed: body.funding_needed !== 'false',
      household_size: body.household_size ? parseInt(body.household_size as string, 10) : null,
      annual_income: clean(body.annual_income as string),
      snap_recipient: body.snap_recipient === 'true',
      tanf_recipient: body.tanf_recipient === 'true',
      barriers,
      workforce_connection: clean(body.workforce_connection as string),
      referral_source: clean(body.referral_source as string),
      probation_or_reentry: body.probation_or_reentry === 'true',
      preferred_location: clean(body.preferred_location as string),
      notes: clean(body.notes as string, 1000),
      funding_tag: fundingTag,
    },
  ]);

  if (error) {
    logger.error('[Intake API]', error.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  // Auto-create a workforce_referrals row when the applicant came through a
  // workforce agency (WorkOne, FSSA, etc.). This satisfies Fix 6 of the
  // workforce pipeline spec — agency referrals must be structured records.
  const WORKFORCE_AGENCY_SOURCES: Record<string, string> = {
    workone: 'workone',
    'workforce-connection': 'workone',
    fssa: 'fssa',
    'snap-et': 'fssa',
    dwd: 'workone',
    'vocational-rehab': 'vocational_rehabilitation',
    vr: 'vocational_rehabilitation',
    jri: 'jri',
    'reentry-program': 'jri',
  };
  const referralSourceRaw = (body.referral_source as string | undefined)?.toLowerCase().trim() ?? '';
  const workforceConnectionRaw = (body.workforce_connection as string | undefined)?.toLowerCase().trim() ?? '';
  const agencyKey = WORKFORCE_AGENCY_SOURCES[referralSourceRaw] ?? WORKFORCE_AGENCY_SOURCES[workforceConnectionRaw];

  if (agencyKey && body.email) {
    (async () => {
      try {
        await supabase.from('workforce_referrals').insert({
          applicant_name: (body.full_name as string).trim(),
          applicant_email: (body.email as string).trim().toLowerCase(),
          applicant_phone: (body.phone as string | undefined)?.trim() || null,
          agency: agencyKey,
          program_interest: (body.program_interest as string | undefined)?.trim() || null,
          status: 'referred',
        });
      } catch (refErr) {
        logger.warn('[Intake API] workforce_referrals insert failed', {
          error: refErr instanceof Error ? refErr.message : 'Unknown',
        });
      }
    })();
  }

  // Provision a learner account if an email was provided.
  // Non-blocking: intake record is already saved above. Auth failures are logged
  // and surfaced in the admin intake queue for manual follow-up.
  const intakeEmail = body.email?.trim().toLowerCase();
  if (intakeEmail) {
    (async () => {
      try {
        // inviteUserByEmail sends a magic link and creates the auth user atomically.
        // If the user already exists, Supabase returns the existing user without error.
        const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          intakeEmail,
          {
            data: {
              full_name: body.full_name.trim(),
              role: 'student',
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/learner/dashboard`,
          },
        );

        if (inviteError) {
          logger.warn('[Intake API] Auth invite failed', {
            email: intakeEmail,
            error: inviteError.message,
          });
          return;
        }

        // Upsert profile row so the learner portal can resolve their role and name.
        // ON CONFLICT: if profile already exists (returning learner), update name only.
        await supabase.from('profiles').upsert(
          {
            id: invited.user.id,
            email: intakeEmail,
            full_name: body.full_name.trim(),
            role: 'student',
            phone: body.phone?.trim() || null,
          },
          { onConflict: 'id', ignoreDuplicates: false },
        );
      } catch (provisionError) {
        logger.error(
          '[Intake API] Learner provisioning error',
          provisionError instanceof Error ? provisionError.message : 'Unknown',
        );
      }
    })();
  }

  // Send email notifications (non-blocking — don't fail the response if email fails)
  const applicationData = {
    id: `intake-${Date.now()}`,
    firstName: body.full_name.trim().split(' ')[0] || body.full_name.trim(),
    lastName: body.full_name.trim().split(' ').slice(1).join(' ') || '',
    email: intakeEmail ?? '',
    phone: body.phone?.trim(),
    programInterest: body.program_interest || 'general',
    city: body.city?.trim(),
    zipCode: '',
    submittedAt: new Date().toISOString(),
  };

  try {
    const emailPromises: Promise<unknown>[] = [];

    // Send admin notification always
    emailPromises.push(sendAdminApplicationNotification(applicationData));

    // Send student confirmation if they provided an email
    if (applicationData.email) {
      emailPromises.push(sendApplicationConfirmation(applicationData));
    }

    await Promise.allSettled(emailPromises);
  } catch (emailError) {
    // Log but don't fail the intake submission
    logger.error(
      '[Intake API] Email notification failed',
      emailError instanceof Error ? emailError.message : 'Unknown error',
    );
  }

  return NextResponse.json({ success: true, funding_tag: fundingTag });
}
export const POST = withApiAudit('/api/intake', _POST);
