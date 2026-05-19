/**
 * Cosmetology Apprenticeship — Canonical Pricing Constants
 *
 * POLICY: Tuition is fixed at $4,980. Never read price from client input.
 * Import COSMETOLOGY_PROGRAM_ID and COSMETOLOGY_COURSE_ID from here instead
 * of hardcoding UUIDs across routes.
 */

export const COSMETOLOGY_PROGRAM_ID = '0661bc6d-c748-4655-b11b-6d418a4ace4a';
export const COSMETOLOGY_COURSE_ID = 'b427be5e-c85b-4b41-91d6-4288aec8c975';

export const TUITION_CENTS = 498000; // $4,980 — same as barber
export const TUITION_DOLLARS = 4980;

export const PAYMENT_TERM_WEEKS = 29;
export const TOTAL_HOURS_REQUIRED = 1500; // Indiana cosmetology: 1,500 hours

export const MIN_SETUP_FEE_CENTS = 25000; // $250
export const MAX_SETUP_FEE_CENTS = TUITION_CENTS;

export function clampSetupFeeCents(inputDollars: number): number {
  const cents = Math.round(inputDollars * 100);
  return Math.min(TUITION_CENTS, Math.max(MIN_SETUP_FEE_CENTS, cents));
}

export function weeklyPaymentCents(downPaymentDollars: number): number {
  const downCents = Math.round(Math.min(TUITION_CENTS, Math.max(0, downPaymentDollars * 100)));
  const remaining = Math.max(0, TUITION_CENTS - downCents);
  if (remaining === 0) return 0;
  return Math.ceil(remaining / PAYMENT_TERM_WEEKS);
}
