import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { PaymentsSettingsClient } from './PaymentsSettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Payments | Admin Settings' };

export default async function PaymentSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', [
      'stripe_mode', 'currency', 'payment_methods',
      'bnpl_enabled', 'affirm_enabled', 'sezzle_enabled', 'klarna_enabled', 'afterpay_enabled',
      'payment_plans_enabled', 'stripe_webhook_endpoint', 'payment_success_url', 'payment_cancel_url',
    ]);

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
          Stripe mode, BNPL providers, payment plans, and redirect URLs.
        </p>
      </div>
      <PaymentsSettingsClient initialSettings={settings} />
    </div>
  );
}
