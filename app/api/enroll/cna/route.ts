// PUBLIC ROUTE: CNA program enrollment form
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireDbWrite, success, failure } from '@/lib/api/safe-handler';
import { checkFailureInjection } from '@/lib/api/failure-injection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    // Failure injection runs before rate limiting so tests aren't blocked
    // by an unconfigured Redis instance in dev/staging environments
    checkFailureInjection(request);

    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      dateOfBirth,
      emergencyContact,
      emergencyPhone,
      paymentOption,
      program,
      price,
      paymentPlan,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolve program_id for CNA from the programs table
    const { data: programRow } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', program || 'cna')
      .maybeSingle();

    // DB write is required — no fallthrough on failure
    const enrollment = await requireDbWrite(
      supabase
        .from('program_enrollments')
        .insert({
          email,
          phone,
          full_name: `${firstName} ${lastName}`.trim(),
          program_id: programRow?.id ?? null,
          funding_source: paymentOption === 'plan' ? 'payment_plan' : 'self_pay',
          amount_paid_cents: paymentOption === 'plan'
            ? Math.round((paymentPlan?.downPayment ?? 0) * 100)
            : Math.round((price ?? 0) * 100),
          status: 'pending_payment',
          enrollment_type: 'cna',
          source: 'cna_enrollment_form',
          notes: JSON.stringify({
            firstName,
            lastName,
            address,
            city,
            state,
            zip_code: zip,
            date_of_birth: dateOfBirth,
            emergency_contact: emergencyContact,
            emergency_phone: emergencyPhone,
            payment_option: paymentOption,
            total_price: price,
            payment_plan: paymentPlan ?? null,
          }),
        })
        .select()
        .maybeSingle(),
      'Failed to create enrollment record. Please try again or call (317) 314-3757.',
    );

    return success({ enrollmentId: enrollment.id });
  } catch (err: unknown) {
    const message = 'Failed to process enrollment';
    logger.error('CNA enrollment error:', err);
    return failure(message);
  }
}
export const POST = withApiAudit('/api/enroll/cna', _POST);
