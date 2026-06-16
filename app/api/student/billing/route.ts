import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getAdminClient();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Check for active enrollment
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('program_slug, enrollment_state')
      .eq('user_id', user.id)
      .in('enrollment_state', ['active', 'enrolled', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ 
        error: 'No active enrollment found',
        hasPaymentMethod: false,
        balance: 0,
        nextPaymentDate: null,
        nextPaymentAmount: null
      });
    }

    // Check for Stripe customer
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    // Try to fetch Stripe payment methods if customer exists
    const hasPaymentMethod = !!profile?.stripe_customer_id;
    let cardBrand: string | null = null;
    let cardLast4: string | null = null;
    let cardExpMonth: number | null = null;
    let cardExpYear: number | null = null;
    let balance = 0;

    if (profile?.stripe_customer_id) {
      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(stripeKey);
          
          const paymentMethods = await stripe.paymentMethods.list({
            customer: profile.stripe_customer_id,
            type: 'card',
            limit: 1,
          });

          if (paymentMethods.data.length > 0) {
            const pm = paymentMethods.data[0];
            cardBrand = pm.card?.brand || null;
            cardLast4 = pm.card?.last4 || null;
            cardExpMonth = pm.card?.exp_month || null;
            cardExpYear = pm.card?.exp_year || null;
          }

          // Fetch customer balance
          const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
          if ('balance' in customer) {
            balance = Math.abs(customer.balance / 100); // Stripe uses cents
          }
        }
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
      }
    }

    return NextResponse.json({
      hasPaymentMethod,
      balance,
      nextPaymentDate: null,
      nextPaymentAmount: null,
      cardBrand,
      cardLast4,
      cardExpMonth,
      cardExpYear,
    });
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
