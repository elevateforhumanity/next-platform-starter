'use client';

import { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function LogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/audit');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setLogs(json.logs ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dev Audit Logs</h1>
            <p className="text-sm text-slate-500">Complete audit trail of all Dev Studio actions</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Action</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Resource</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono text-xs text-slate-800">{log.action}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{log.resource_type ?? '—'}</td>
                <td className="py-3 px-4 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && !error && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">Integration pending: dev_audit_logs table migration not yet applied</p>
          </div>
        )}
      </div>
    </div>
  );
}
