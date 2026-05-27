import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { NotificationsSettingsClient } from './NotificationsSettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Notifications | Admin Settings' };

export default async function NotificationSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', [
      'email_notifications', 'sms_notifications', 'slack_webhook',
      'notify_on_enrollment', 'notify_on_application', 'notify_on_payment', 'notify_on_certificate',
      'alert_email', 'alert_email_to',
    ]);

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
          Email, SMS, Slack, and per-event notification configuration.
        </p>
      </div>
      <NotificationsSettingsClient initialSettings={settings} />
    </div>
  );
}
