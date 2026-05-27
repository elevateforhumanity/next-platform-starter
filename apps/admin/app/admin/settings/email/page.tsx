import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { EmailSettingsClient } from './EmailSettingsClient';

const KEYS = [
  'email_from_name', 'email_from_address', 'reply_to_email',
  'email_provider', 'mou_archive_email', 'sponsor_finance_email',
];

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Email | Admin Settings' };

export default async function EmailSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', KEYS);

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
          Sender addresses, reply-to routing, and email provider configuration.
        </p>
      </div>
      <EmailSettingsClient initialSettings={settings} />
    </div>
  );
}
