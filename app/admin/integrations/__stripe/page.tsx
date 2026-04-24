export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  CreditCard, AlertTriangle, CheckCircle2, Clock,
  DollarSign, Users, TrendingUp, XCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Stripe Integration | Admin | Elevate For Humanity',
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/integrations/stripe' },
};

type FlagType = 'no_payment_evidence' | 'bnpl_unverified' | 'blocked_pending_review' | string;
type Resolution = 'payment_confirmed' | 'waived' | 'enrollment_revoked' | 'false_positive' | string | null;

interface PaymentFlag {
  id: string;
  entity_type: string;
  entity_id: string;
  flag_type: FlagType;
  flag_reason: string;
  flagged_at: string;
  flagged_by: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: Resolution;
  metadata: Record<string, unknown>;
}

interface Enrollment {
  id: string;
  full_name: string | null;
  email: string;
  amount_paid_cents: number;
  funding_source: string | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  status: string;
  enrolled_at: string;
}

const FLAG_LABELS: Record<string, string> = {
  no_payment_evidence: 'No Payment Evidence',
  bnpl_unverified: 'BNPL Unverified',
  blocked_pending_review: 'Blocked — Pending Review',
};

const RESOLUTION_LABELS: Record<string, string> = {
  payment_confirmed: 'Payment Confirmed',
  waived: 'Waived',
  enrollment_revoked: 'Enrollment Revoked',
  false_positive: 'False Positive',
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function AdminStripeIntegrationPage() {
  await requireAdmin();
  const supabase = getAdminClient();

  const [flagsResult, enrollmentsResult] = await Promise.all([
    supabase
      .from('payment_integrity_flags')
      .select('*')
      .order('flagged_at', { ascending: false })
      .limit(200),
    supabase
      .from('program_enrollments')
      .select('id, full_name, email, amount_paid_cents, funding_source, stripe_payment_intent_id, stripe_session_id, status, enrolled_at')
      .not('stripe_payment_intent_id', 'is', null)
      .order('enrolled_at', { ascending: false })
      .limit(100),
  ]);

  const flags: PaymentFlag[] = flagsResult.data ?? [];
  const enrollments: Enrollment[] = enrollmentsResult.data ?? [];

  const unresolvedFlags = flags.filter((f) => !f.resolved_at);
  const resolvedFlags = flags.filter((f) => !!f.resolved_at);

  const totalRevenueCents = enrollments.reduce((sum, e) => sum + (e.amount_paid_cents ?? 0), 0);
  const stripeEnrollments = enrollments.filter((e) => !!e.stripe_payment_intent_id);

  const stripeConfigured =
    !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookConfigured = !!process.env.STRIPE_WEBHOOK_SECRET;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Stripe' },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-violet-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stripe Integration</h1>
            <p className="text-sm text-slate-500">Payment processing, integrity flags, and enrollment revenue</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {stripeConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="w-4 h-4" /> API Keys Set
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-700">
                <XCircle className="w-4 h-4" /> API Keys Missing
              </span>
            )}
            {webhookConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Webhook Secret Set
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" /> Webhook Not Configured
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-sm text-slate-500">Stripe Revenue</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCents(totalRevenueCents)}</p>
            <p className="text-xs text-slate-400 mt-1">{stripeEnrollments.length} paid enrollments</p>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-slate-500">Total Enrollments</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{enrollments.length}</p>
            <p className="text-xs text-slate-400 mt-1">with Stripe payment ID</p>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-slate-500">Open Flags</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{unresolvedFlags.length}</p>
            <p className="text-xs text-slate-400 mt-1">require review</p>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-500">Resolved Flags</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{resolvedFlags.length}</p>
            <p className="text-xs text-slate-400 mt-1">all time</p>
          </div>
        </div>

        {/* Open Payment Integrity Flags */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Open Payment Integrity Flags
            {unresolvedFlags.length > 0 && (
              <span className="ml-2 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {unresolvedFlags.length}
              </span>
            )}
          </h2>
          {unresolvedFlags.length === 0 ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">No open flags — all payments verified</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Flag Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Reason</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Flagged By</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Flagged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unresolvedFlags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          {FLAG_LABELS[flag.flag_type] ?? flag.flag_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{flag.flag_reason}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{flag.entity_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-slate-500">{flag.flagged_by}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(flag.flagged_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Stripe Enrollments */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-violet-600" />
            Recent Stripe Enrollments
          </h2>
          {enrollments.length === 0 ? (
            <div className="rounded-xl border bg-slate-50 p-6 text-center text-sm text-slate-500">
              No Stripe-linked enrollments found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name / Email</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Funding</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Payment Intent</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{e.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCents(e.amount_paid_cents)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">
                        {e.funding_source ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          e.status === 'active' || e.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : e.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {e.status === 'active' || e.status === 'completed'
                            ? <CheckCircle2 className="w-3 h-3" />
                            : e.status === 'pending'
                            ? <Clock className="w-3 h-3" />
                            : <XCircle className="w-3 h-3" />}
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {e.stripe_payment_intent_id
                          ? e.stripe_payment_intent_id.slice(0, 20) + '…'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(e.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Resolved Flags (collapsed summary) */}
        {resolvedFlags.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Resolved Flags
              <span className="ml-2 text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {resolvedFlags.length}
              </span>
            </h2>
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Flag Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Resolution</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Flagged At</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Resolved At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resolvedFlags.slice(0, 50).map((flag) => (
                    <tr key={flag.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {FLAG_LABELS[flag.flag_type] ?? flag.flag_type}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          {flag.resolution ? (RESOLUTION_LABELS[flag.resolution] ?? flag.resolution) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(flag.flagged_at)}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {flag.resolved_at ? formatDate(flag.resolved_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Env var checklist */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Configuration Checklist</h2>
          <div className="rounded-xl border shadow-sm overflow-hidden">
            {[
              { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', required: true },
              { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key', required: true },
              { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', required: true },
              { key: 'STRIPE_PRICE_ID', label: 'Default Price ID', required: false },
            ].map(({ key, label, required }) => {
              const set = !!process.env[key];
              return (
                <div key={key} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs font-mono text-slate-400">{key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!required && <span className="text-xs text-slate-400">optional</span>}
                    {set ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3" /> Set
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3" /> Missing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
