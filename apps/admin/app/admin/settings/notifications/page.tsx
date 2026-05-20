import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Notifications | Admin Settings' };

export default async function NotificationSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['email_notifications', 'sms_notifications', 'slack_webhook']);

  const settings: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Notifications
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notification Settings</h1>
        <p className="text-slate-500">
          Configure email, SMS, and webhook notifications.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">Send enrollment and progress email alerts</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['email_notifications'] || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">Text message alerts for critical events</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['sms_notifications'] || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Slack Webhook</p>
              <p className="text-xs text-slate-500 mt-0.5">Post notifications to a Slack channel</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['slack_webhook'] ? 'Configured' : 'Not set'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          To update notification preferences, use{' '}
          <Link href="/admin/dev-studio?tab=secrets" className="text-brand-blue-600 underline">
            Dev Studio → Secrets
          </Link>{' '}
          for webhook credentials, or the{' '}
          <Link href="/admin/integrations/env-manager" className="text-brand-blue-600 underline">
            Env Manager
          </Link>{' '}
          for integration keys.
        </p>
      </div>
    </div>
  );
}
