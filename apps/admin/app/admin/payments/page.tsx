import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  DollarSign, CreditCard, AlertTriangle, CheckCircle2,
  TrendingUp, Users, RefreshCw, ExternalLink, Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Payments | Admin' };

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${Math.floor(diff / 60000)}m ago`;
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid:       'bg-green-100 text-green-800',
  unpaid:     'bg-red-100 text-red-800',
  pending:    'bg-yellow-100 text-yellow-800',
  refunded:   'bg-slate-100 text-slate-600',
  waived:     'bg-blue-100 text-blue-800',
  failed:     'bg-red-100 text-red-800',
  succeeded:  'bg-green-100 text-green-800',
  active:     'bg-green-100 text-green-800',
  canceled:   'bg-slate-100 text-slate-600',
  past_due:   'bg-red-100 text-red-800',
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  await hydrateProcessEnv();

  const sp = await searchParams;
  const tab = sp.tab || 'enrollments';

  const db = await requireAdminClient();
  const stripe = getStripe();

  // ── Enrollment payments (Supabase) ───────────────────────────────────────
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('id, user_id, program_slug, enrolled_at, payment_status, amount_paid_cents, stripe_subscription_status, stripe_customer_id')
    .order('enrolled_at', { ascending: false })
    .limit(200);

  const enrollRows = enrollments ?? [];

  // Hydrate names
  const userIds = [...new Set(enrollRows.map((r: any) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const nameMap: Record<string, { name: string; email: string }> = {};
  (profiles ?? []).forEach((p: any) => {
    nameMap[p.id] = { name: p.full_name || p.email || p.id.slice(0, 8), email: p.email || '' };
  });

  // ── Testing payments (Supabase) ──────────────────────────────────────────
  const { data: testingPayments } = await db
    .from('exam_bookings')
    .select('id, first_name, last_name, email, exam_name, exam_type, fee_cents, payment_status, payment_intent_id, created_at, status')
    .order('created_at', { ascending: false })
    .limit(100);

  // ── Stripe recent charges (live) ─────────────────────────────────────────
  let stripeCharges: any[] = [];
  let stripeSubscriptions: any[] = [];
  let stripeError: string | null = null;

  if (stripe) {
    try {
      const [chargesRes, subsRes] = await Promise.all([
        stripe.charges.list({ limit: 50 }),
        stripe.subscriptions.list({ limit: 50, status: 'all' } as any),
      ]);
      stripeCharges = chargesRes.data;
      stripeSubscriptions = subsRes.data;
    } catch (err) {
      stripeError = err instanceof Error ? err.message : 'Stripe unavailable';
    }
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalEnrollRevenue = enrollRows
    .filter((r: any) => r.payment_status === 'paid')
    .reduce((s: number, r: any) => s + (r.amount_paid_cents ?? 0), 0);

  const totalTestingRevenue = (testingPayments ?? [])
    .filter((r: any) => r.payment_status === 'paid')
    .reduce((s: number, r: any) => s + (r.fee_cents ?? 0), 0);

  const activeSubscriptions = enrollRows.filter((r: any) =>
    r.stripe_subscription_status === 'active'
  ).length;

  const pastDue = enrollRows.filter((r: any) =>
    r.stripe_subscription_status === 'past_due'
  ).length;

  const unpaidEnrollments = enrollRows.filter((r: any) =>
    r.payment_status === 'unpaid' || r.payment_status === 'pending'
  ).length;

  const stripeRevenue30d = stripeCharges
    .filter((c) => c.paid && c.status === 'succeeded' && c.created > (Date.now() / 1000 - 30 * 86400))
    .reduce((s, c) => s + c.amount, 0);

  const tabs = [
    { key: 'enrollments', label: 'Enrollments' },
    { key: 'testing',     label: 'Testing' },
    { key: 'stripe',      label: 'Stripe Charges' },
    { key: 'subscriptions', label: 'Subscriptions' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enrollment fees · testing payments · subscriptions · Stripe transactions
          </p>
        </div>
        {stripe && (
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Stripe Dashboard
          </a>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Enroll Revenue',   value: fmtMoney(totalEnrollRevenue),   icon: DollarSign,   color: 'text-emerald-700' },
          { label: 'Testing Revenue',  value: fmtMoney(totalTestingRevenue),  icon: CreditCard,   color: 'text-blue-700' },
          { label: 'Stripe (30d)',     value: fmtMoney(stripeRevenue30d),     icon: TrendingUp,   color: 'text-purple-700' },
          { label: 'Active Subs',      value: activeSubscriptions,            icon: RefreshCw,    color: 'text-green-700' },
          { label: 'Past Due',         value: pastDue,                        icon: AlertTriangle,color: pastDue > 0 ? 'text-red-600' : 'text-slate-400' },
          { label: 'Unpaid Enrolls',   value: unpaidEnrollments,              icon: Clock,        color: unpaidEnrollments > 0 ? 'text-yellow-600' : 'text-slate-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stripe error */}
      {stripeError && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Stripe unavailable: {stripeError}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/payments?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Tab: Enrollments ── */}
      {tab === 'enrollments' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Program</th>
                  <th className="text-left px-4 py-3 font-medium">Enrolled</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 font-medium">Subscription</th>
                  <th className="text-right px-4 py-3 font-medium">Amount Paid</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrollRows.map((r: any) => {
                  const user = nameMap[r.user_id];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{user?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{user?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{r.program_slug}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {r.enrolled_at ? timeSince(r.enrolled_at) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_STATUS_STYLES[r.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {r.payment_status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.stripe_subscription_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_STATUS_STYLES[r.stripe_subscription_status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {r.stripe_subscription_status}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {r.amount_paid_cents ? fmtMoney(r.amount_paid_cents) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.stripe_customer_id && (
                          <a
                            href={`https://dashboard.stripe.com/customers/${r.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            Stripe →
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Testing ── */}
      {tab === 'testing' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium">Booking Status</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-right px-4 py-3 font-medium">Fee</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(testingPayments ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-slate-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[160px] truncate">{r.exam_name || r.exam_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_STATUS_STYLES[r.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {r.fee_cents ? fmtMoney(r.fee_cents) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {timeSince(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/testing-center/${r.id}`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Stripe Charges ── */}
      {tab === 'stripe' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {stripeCharges.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{stripeError ? 'Stripe unavailable' : 'No charges found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stripeCharges.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{c.billing_details?.name || '—'}</p>
                        <p className="text-xs text-slate-400">{c.billing_details?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate">
                        {c.description || c.statement_descriptor || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.paid && c.status === 'succeeded' ? 'bg-green-100 text-green-800' : c.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {c.status}
                        </span>
                        {c.refunded && (
                          <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">refunded</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {fmtMoney(c.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {fmtDate(c.created)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://dashboard.stripe.com/charges/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          Stripe →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Subscriptions ── */}
      {tab === 'subscriptions' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {stripeSubscriptions.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{stripeError ? 'Stripe unavailable' : 'No subscriptions found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Interval</th>
                    <th className="text-left px-4 py-3 font-medium">Current Period</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stripeSubscriptions.map((s: any) => {
                    const item = s.items?.data?.[0];
                    const price = item?.price;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 font-mono text-xs">{s.customer}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_STATUS_STYLES[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {price?.unit_amount ? fmtMoney(price.unit_amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {price?.recurring?.interval ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {fmtDate(s.current_period_start)} – {fmtDate(s.current_period_end)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            Stripe →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
