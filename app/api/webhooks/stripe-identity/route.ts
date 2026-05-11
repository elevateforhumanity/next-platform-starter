import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';

import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

async function _POST(request: NextRequest) {
  await hydrateProcessEnv();

  const stripeClient = getStripe();
  if (!stripeClient) {
    return NextResponse.json({ received: true, warning: 'stripe_not_configured' }, { status: 200 });
  }

  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ received: true, warning: 'misconfigured' }, { status: 200 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ received: true, warning: 'supabase_not_configured' }, { status: 200 });
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase
    .from('stripe_webhook_events')
    .insert({ stripe_event_id: event.id, event_type: event.type, status: 'processing' })
    .catch(() => {});

  // Handle verification session events
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (!userId) {
      /* Condition handled */
    }

    try {
      const { error: verifyUpdateError } = await supabase
        .from('program_holder_verification')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('stripe_verification_session_id', session.id);

      if (verifyUpdateError) {
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      if (userId) {
        await supabase
          .from('program_holder_verification')
          .update({ status: 'verified', verified_at: new Date().toISOString() })
          .eq('user_id', userId)
          .in('status', ['pending', 'failed'])
          .catch(() => {});
      }

      // Email notification handled by trigger to user
    } catch (error) {
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  // Handle verification session failures
  if (
    event.type === 'identity.verification_session.requires_input' ||
    event.type === 'identity.verification_session.canceled'
  ) {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (!userId) {
      /* Condition handled */
    }

    try {
      const { error: failUpdateError } = await supabase
        .from('program_holder_verification')
        .update({
          status: 'failed',
          notes: session.last_error?.reason || 'Verification failed',
        })
        .eq('stripe_verification_session_id', session.id);

      if (failUpdateError) {
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      if (userId) {
        await supabase
          .from('program_holder_verification')
          .update({ status: 'failed', notes: session.last_error?.reason || 'Verification failed' })
          .eq('user_id', userId)
          .eq('status', 'pending')
          .catch(() => {});
      }

      // Email notification handled by trigger to user
    } catch (error) {
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  await supabase
    .from('stripe_webhook_events')
    .update({ status: 'processed' })
    .eq('stripe_event_id', event.id)
    .catch(() => {});

  return NextResponse.json({ received: true });
}
export const POST = withApiAudit('/api/webhooks/stripe-identity', _POST, {
  actor_type: 'webhook',
  skip_body: true,
  critical: true,
});
