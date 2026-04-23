import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, User, Clock, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Audit Logs | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-slate-100 text-slate-600',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-orange-100 text-orange-700',
};

export default async function AdminAuditsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = getAdminClient();

  const [logsRes, profilesRes] = await Promise.all([
    db.from('audit_logs')
      .select('id, action, actor_id, target_type, target_id, metadata, ip_address, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('profiles')
      .select('id, full_name, email'),
  ]);

  const logs = logsRes.data ?? [];
  const profileMap: Record<string, { full_name: string; email: string }> = {};
  for (const p of profilesRes.data ?? []) profileMap[p.id] = p;

  const byAction: Record<string, number> = {};
  for (const l of logs) {
    const key = l.action?.split('.')[0] ?? 'unknown';
    byAction[key] = (byAction[key] ?? 0) + 1;
  }

  const today = logs.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-slate-600" /> Audit Logs
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Platform activity trail — last 100 events</p>
          </div>
          <Link href="/admin/compliance" className="text-sm text-blue-600 hover:underline">
            Compliance center →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total (shown)', value: logs.length },
            { label: 'Today', value: today },
            { label: 'Unique Actions', value: Object.keys(byAction).length },
            { label: 'Actors', value: new Set(logs.map((l) => l.actor_id).filter(Boolean)).size },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-3xl font-bold text-slate-700">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action breakdown */}
        {Object.keys(byAction).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byAction).sort((a, b) => b[1] - a[1]).map(([action, count]) => (
              <span key={action} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${ACTION_COLORS[action] ?? 'bg-slate-100 text-slate-600'}`}>
                <Activity className="w-3 h-3" />
                {action} ({count})
              </span>
            ))}
          </div>
        )}

        {/* Logs table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Action</th>
                    <th className="px-6 py-3 text-left">Actor</th>
                    <th className="px-6 py-3 text-left">Target</th>
                    <th className="px-6 py-3 text-left">IP</th>
                    <th className="px-6 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const actor = log.actor_id ? profileMap[log.actor_id] : null;
                    const actionKey = log.action?.split('.')[0] ?? 'unknown';
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[actionKey] ?? 'bg-slate-100 text-slate-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {actor ? (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-700">{actor.full_name ?? actor.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">{log.actor_id ? log.actor_id.slice(0, 8) + '…' : 'system'}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {log.target_type ? (
                            <span>{log.target_type}{log.target_id ? ` · ${log.target_id.slice(0, 8)}…` : ''}</span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-3 text-slate-400 text-xs font-mono">{log.ip_address ?? '—'}</td>
                        <td className="px-6 py-3 text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
