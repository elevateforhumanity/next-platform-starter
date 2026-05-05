-- Fix Natalia Roa's enrollment state
-- She was approved and an enrollment row was created, but her Stripe checkout
-- session expired without payment. enrollment_state='enrolled' with
-- next_required_action='AWAIT_APPROVAL' blocks the onboarding page from
-- showing the payment step.
-- Reset to 'pending' so she is routed to the payment flow on next login.

UPDATE public.program_enrollments
SET
  enrollment_state      = 'pending',
  next_required_action  = 'PAYMENT',
  payment_status        = 'pending',
  stripe_checkout_session_id = NULL,  -- clear expired session
  updated_at            = now()
WHERE id = '6ad966f1-f8fd-457f-9f5e-5391072f9f29'
  AND user_id = '2d761d18-6ff9-4355-b9dd-5ff55903906b';

-- Also clear the expired session from the application row
UPDATE public.applications
SET
  stripe_session_id     = NULL,
  payment_status        = 'pending',
  updated_at            = now()
WHERE id = 'c4b48167-7780-4ea5-9c3c-53afa5c2cf1b'
  AND user_id = '2d761d18-6ff9-4355-b9dd-5ff55903906b';
