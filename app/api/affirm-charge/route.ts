import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { sendEnrollmentEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const { checkout_token, program, user_email } = await request.json();
    // Always use the authenticated user's ID — never trust user_id from the request body.
    const user_id = auth.user.id;

    // Call Affirm API to authorize the charge
    const publicKey = process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
    const privateKey = process.env.AFFIRM_PRIVATE_API_KEY;

    if (!publicKey || !privateKey) {
      throw new Error('Affirm API keys not configured');
    }

    const affirmResponse = await fetch('https://api.affirm.com/api/v2/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${publicKey}:${privateKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        checkout_token,
      }),
    });

    const chargeData = await affirmResponse.json();

    if (!affirmResponse.ok) {
      throw new Error(chargeData.message || 'Affirm charge failed');
    }

    // Save enrollment to database
    const supabase = await createClient();

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id,
        program_id: program,
        payment_method: 'affirm',
        payment_status: 'completed',
        payment_reference: chargeData.id,
        amount_paid: chargeData.amount / 100, // Convert cents to dollars
        status: 'active',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) {
      // Don't fail the request - payment succeeded
      // Log for manual reconciliation
    }

    // Send enrollment confirmation email
    if (enrollment && user_email) {
      try {
        // Get program name
        const { data: programData } = await supabase
          .from('programs')
          .select('title')
          .eq('id', program)
          .single();

        await sendEnrollmentEmail({
          to: user_email,
          programName: programData?.title || 'Your Program',
          enrollmentId: enrollment.id,
        });
      } catch (emailError) {
        // Don't fail the request - enrollment succeeded
      }
    }

    return NextResponse.json({
      success: true,
      charge_id: chargeData.id,
      enrollment_id: enrollment?.id,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to process Affirm payment');
  }
}
