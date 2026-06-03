#!/usr/bin/env npx tsx
/**
 * Run weekly Stripe billing setup for barber apprentices (Jordan + Natalia by default).
 *
 * Requires live keys:
 *   STRIPE_SECRET_KEY (or STRIPE_KEY)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *
 * Usage:
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts --customer cus_UGFxoJKjtlNoy8
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts --subscription-only
 */

import Stripe from 'stripe';
import { runApprenticeStripeBilling } from '../lib/barber/apprentice-stripe-billing';

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || '';
if (!stripeKey) {
  console.error('Set STRIPE_SECRET_KEY (live) before running.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion });

const args = process.argv.slice(2);
const customerIdx = args.indexOf('--customer');
const customerIds =
  customerIdx >= 0 && args[customerIdx + 1] ? [args[customerIdx + 1]] : undefined;
const subscriptionOnly = args.includes('--subscription-only');
const invoicesOnly = args.includes('--invoices-only');

const actions =
  subscriptionOnly ? (['ensure_subscription'] as const)
  : invoicesOnly ? (['pay_open_invoices'] as const)
  : (['ensure_subscription', 'pay_open_invoices'] as const);

async function main() {
  console.log('Running apprentice Stripe billing...\n');
  const results = await runApprenticeStripeBilling(stripe, {
    customerIds,
    actions: [...actions],
  });
  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.name} (${r.customerId}) — ${r.action}: ${r.detail}`);
    if (r.subscriptionId) console.log(`   subscription: ${r.subscriptionId}`);
    if (r.invoiceId) console.log(`   invoice: ${r.invoiceId}`);
  }
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
