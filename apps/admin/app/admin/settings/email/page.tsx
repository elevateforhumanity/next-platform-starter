import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Email | Admin Settings' };

export default async function EmailSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['email_from_name', 'email_from_address', 'email_provider']);

  const settings: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Email
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Settings</h1>
        <p className="text-slate-500">
          Sender identity, provider configuration, and email templates.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">From Name</p>
              <p className="text-xs text-slate-500 mt-0.5">Display name on outbound emails</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['email_from_name'] || 'Elevate for Humanity'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">From Address</p>
              <p className="text-xs text-slate-500 mt-0.5">Sender email address</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['email_from_address'] || 'noreply@elevateforhumanity.org'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Provider</p>
              <p className="text-xs text-slate-500 mt-0.5">Active email delivery service</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['email_provider'] || 'SendGrid'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Email API keys (SendGrid, Resend, SMTP) are configured in the{' '}
          <Link href="/admin/integrations/env-manager" className="text-brand-blue-600 underline">
            Env Manager
          </Link>.
        </p>
      </div>
    </div>
  );
}
