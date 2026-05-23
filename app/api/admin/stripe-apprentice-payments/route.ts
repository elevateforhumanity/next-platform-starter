import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getStripe } from '@/lib/stripe/client';

export const dynamic = 'force-dynamic';

// Barber apprentice Stripe customer IDs (live)
const APPRENTICE_CUSTOMERS: Record<
  string,
  {
    name: string;
    email: string;
    enrollmentId: string;
    weeklyRateCents: number;
    startDate: string;
    hostShop: string;
    studentNumber: string;
    ojtHours: number;
    transferHours: number;
    downPaymentCents: number;
  }
> = {
  cus_UGFxoJKjtlNoy8: {
    name: 'Jordan White',
    email: 'jbwhite888@icloud.com',
    enrollmentId: '47e75da9-2903-4b9a-ba3b-fc23f00ec1a5',
    weeklyRateCents: 7641,
    startDate: '2026-04-17',
    hostShop: 'Kountry Kutz',
    studentNumber: 'ELV-2026-00114',
    ojtHours: 200,
    transferHours: 350,
    downPaymentCents: 200000,
  },
  cus_UG4BIa05facQez: {
    name: 'Wellington Mercedes',
    email: 'msanqin@gmail.com',
    enrollmentId: '0320f78d-40df-4fb4-b5b9-3bed858e975b',
    weeklyRateCents: 15103,
    startDate: '2026-04-13',
    hostShop: 'Prestige Elevation Barber and Beauty Institute',
    studentNumber: 'ELV-2026-00106',
    ojtHours: 160,
    transferHours: 0,
    downPaymentCents: 60000,
  },
  cus_UTVa6pmsYlWBsp: {
    name: 'Natalia Roa',
    email: 'natataroa@gmail.com',
    enrollmentId: '6ad966f1-f8fd-457f-9f5e-5391072f9f29',
    weeklyRateCents: 15103,
    startDate: '2026-05-12',
    hostShop: 'Kountry Kutz',
    studentNumber: 'ELV-2026-00263',
    ojtHours: 40,
    transferHours: 0,
    downPaymentCents: 60000,
  },
};

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    const results = await Promise.all(
      Object.entries(APPRENTICE_CUSTOMERS).map(async ([customerId, meta]) => {
        const [charges, subscriptions, invoices] = await Promise.all([
          stripe.charges.list({ customer: customerId, limit: 50 }),
          stripe.subscriptions.list({ customer: customerId, limit: 10, status: 'all' } as any),
          stripe.invoices.list({ customer: customerId, limit: 50 }),
        ]);

        const totalPaidCents = charges.data
          .filter((c) => c.paid && c.status === 'succeeded')
          .reduce((sum, c) => sum + c.amount, 0);

        const activeSub = subscriptions.data.find((s) => s.status === 'active');
        const latestSub = subscriptions.data[0] ?? null;

        const totalHours = meta.ojtHours + meta.transferHours;
        const requiredHours = 2000;
        const progressPct = Math.round((totalHours / requiredHours) * 100);

        // Payment schedule: weeks since start × weekly rate
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksSinceStart = Math.floor(
          (Date.now() - new Date(meta.startDate).getTime()) / msPerWeek,
        );
        const week1Free = 1;
        const weeksBilled = Math.max(0, weeksSinceStart - week1Free);
        const totalScheduledCents = weeksBilled * meta.weeklyRateCents;
        const creditRemaining = Math.max(0, meta.downPaymentCents - totalScheduledCents);
        const weeksOfCreditLeft = Math.floor(creditRemaining / meta.weeklyRateCents);

        return {
          customerId,
          ...meta,
          totalPaidCents,
          totalPaidFormatted: formatCents(totalPaidCents),
          totalHours,
          ojtHours: meta.ojtHours,
          transferHours: meta.transferHours,
          progressPct,
          weeksBilled,
          totalScheduledCents,
          totalScheduledFormatted: formatCents(totalScheduledCents),
          creditRemainingCents: creditRemaining,
          creditRemainingFormatted: formatCents(creditRemaining),
          weeksOfCreditLeft,
          subscription: latestSub
            ? {
                id: latestSub.id,
                status: latestSub.status,
                isActive: latestSub.status === 'active',
                weeklyAmountCents: (latestSub.items.data[0]?.price?.unit_amount ?? 0),
                weeklyAmountFormatted: formatCents(
                  latestSub.items.data[0]?.price?.unit_amount ?? 0,
                ),
                currentPeriodEnd: new Date(
                  (latestSub as any).current_period_end * 1000,
                ).toISOString(),
                created: new Date(latestSub.created * 1000).toISOString(),
              }
            : null,
          hasActiveSubscription: !!activeSub,
          charges: charges.data.map((c) => ({
            id: c.id,
            amountCents: c.amount,
            amountFormatted: formatCents(c.amount),
            status: c.status,
            paid: c.paid,
            created: new Date(c.created * 1000).toISOString(),
            description: c.description,
            receiptUrl: c.receipt_url,
            failureMessage: c.failure_message,
          })),
          invoices: invoices.data.map((i) => ({
            id: i.id,
            amountPaidCents: i.amount_paid,
            amountDueCents: i.amount_due,
            amountPaidFormatted: formatCents(i.amount_paid),
            status: i.status,
            paid: i.paid,
            created: new Date(i.created * 1000).toISOString(),
            description: i.description,
            hostedInvoiceUrl: i.hosted_invoice_url,
          })),
        };
      }),
    );

    return NextResponse.json({ students: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 });
  }
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
