import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Clock, ChevronRight, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Audit Logs | Admin' };

export default async function AuditLogsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  const [logsRes, totalRes] = await Promise.all([
    db.from('audit_logs')
      .select('id, action, actor_id, actor_email, actor_role, resource_type, resource_id, target_type, target_id, event_type, ip_address, created_at, metadata, details')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('audit_logs').select('id', { count: 'exact', head: true }),
  ]);

  const logs       = logsRes.data ?? [];
  const totalCount = totalRes.count ?? 0;

  // Hydrate actor profiles where actor_email is missing
  const actorIds = [...new Set(logs.filter((l: any) => !l.actor_email && l.actor_id).map((l: any) => l.actor_id))];
  const { data: actors } = actorIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] };
  const actorMap = Object.fromEntries((actors ?? []).map((a: any) => [a.id, a]));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Audit Logs</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-slate-600" /> Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">{totalCount.toLocaleString()} total events · showing most recent 100</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {logs.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No audit events recorded</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                {['Time','Actor','Action','Resource','IP'].map(h => (
                  <th key={h} className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log: any) => {
                  const actor = actorMap[log.actor_id];
                  const actorLabel = log.actor_email ?? actor?.email ?? actor?.full_name ?? log.actor_id ?? 'System';
                  const resource = [log.resource_type ?? log.target_type, log.resource_id ?? log.target_id].filter(Boolean).join(' ');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5 text-slate-500 text-xs whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-5">
                        <p className="text-xs font-medium text-slate-900 truncate max-w-[140px]">{actorLabel}</p>
                        {log.actor_role && <p className="text-[10px] text-slate-400">{log.actor_role}</p>}
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{log.action ?? log.event_type ?? '—'}</span>
                      </td>
                      <td className="py-3 px-5 text-slate-500 text-xs truncate max-w-[160px]">{resource || '—'}</td>
                      <td className="py-3 px-5 text-slate-400 text-xs font-mono">{log.ip_address ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
