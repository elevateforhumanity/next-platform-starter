-- cosmetology_subscriptions: weekly payment plan table mirroring barber_subscriptions
-- Apply in Supabase Dashboard SQL Editor before using cosmo payment-setup page.

CREATE TABLE IF NOT EXISTS public.cosmetology_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  enrollment_id UUID,

  -- Stripe identifiers
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,

  -- Customer info
  customer_email TEXT,
  customer_name TEXT,

  -- Subscription status
  -- pending_payment_method → active → cancelled / past_due / suspended
  status TEXT DEFAULT 'pending_payment_method',
  payment_status TEXT DEFAULT 'current', -- current | past_due | failed | suspended

  -- Payment details
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_amount INTEGER,
  weekly_payment_cents INTEGER,
  weeks_remaining INTEGER,

  -- Billing dates
  billing_cycle_anchor TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,

  -- Email tracking (for idempotency)
  welcome_email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cosmetology_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own record
CREATE POLICY "Users read own cosmetology subscription"
  ON public.cosmetology_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role handles all writes via admin client
CREATE INDEX IF NOT EXISTS idx_cosmetology_subscriptions_user_id
  ON public.cosmetology_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_cosmetology_subscriptions_payment_status
  ON public.cosmetology_subscriptions (payment_status);
