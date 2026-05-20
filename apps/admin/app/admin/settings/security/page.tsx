import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Security | Admin Settings' };

export default async function SecuritySettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['mfa_required', 'session_timeout', 'ip_allowlist']);

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
          MFA, session management, and IP access controls.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">MFA Required</p>
              <p className="text-xs text-slate-500 mt-0.5">Require multi-factor authentication for admin users</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['mfa_required'] || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Session Timeout</p>
              <p className="text-xs text-slate-500 mt-0.5">Auto-logout after idle period</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['session_timeout'] || 'Default (30min)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">IP Allowlist</p>
              <p className="text-xs text-slate-500 mt-0.5">Restrict admin access to specific IPs (ADMIN_IP_ALLOWLIST)</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {settings['ip_allowlist'] || 'Disabled'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          IP allowlist is controlled by the <code className="bg-slate-100 px-1 rounded">ADMIN_IP_ALLOWLIST</code> environment variable.
          Set it in{' '}
          <Link href="/admin/dev-studio?tab=secrets" className="text-brand-blue-600 underline">
            Dev Studio → Secrets
          </Link>.
        </p>
      </div>
    </div>
  );
}
