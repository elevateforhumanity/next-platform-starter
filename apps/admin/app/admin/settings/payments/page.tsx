import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Payments | Admin Settings' };

export default async function PaymentSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['stripe_mode', 'currency', 'payment_methods']);

  const settings: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Payments
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Settings</h1>
        <p className="text-slate-500">
          Stripe configuration, payment methods, and currency.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Stripe Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Live or test mode for payment processing</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['stripe_mode'] || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Currency</p>
              <p className="text-xs text-slate-500 mt-0.5">Default currency for transactions</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['currency'] || 'USD'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Payment Methods</p>
              <p className="text-xs text-slate-500 mt-0.5">Enabled payment providers (Stripe, Affirm, Sezzle)</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['payment_methods'] || 'Stripe + BNPL'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Stripe API keys are managed in{' '}
          <Link href="/admin/dev-studio?tab=secrets" className="text-brand-blue-600 underline">
            Dev Studio → Secrets
          </Link>. Integration keys (webhooks, price IDs) live in the{' '}
          <Link href="/admin/integrations/env-manager" className="text-brand-blue-600 underline">
            Env Manager
          </Link>.
        </p>
      </div>
    </div>
  );
}
