import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { SecuritySettingsClient } from './SecuritySettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Security | Admin Settings' };

export default async function SecuritySettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', [
      'mfa_required', 'session_timeout', 'ip_allowlist',
      'demo_mode', 'demo_allow_in_prod', 'max_login_attempts', 'lockout_duration_minutes',
    ]);

  const settings: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Security
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security Settings</h1>
        <p className="text-slate-500">
          MFA, session timeout, IP allowlist, and login lockout configuration.
        </p>
      </div>
      <SecuritySettingsClient initialSettings={settings} />
    </div>
  );
}
