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
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>Dev Audit Logs</h1>
        </div>
        <button onClick={fetchLogs} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ color: '#cccccc' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: '#858585' }}>Action</th>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: '#858585' }}>Resource</th>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: '#858585' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                <td className="py-2 px-3 font-mono">{log.action}</td>
                <td className="py-2 px-3" style={{ color: '#858585' }}>{log.resource_type ?? '—'}</td>
                <td className="py-2 px-3" style={{ color: '#858585' }}>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>Integration pending: dev_audit_logs table migration not yet applied</p>
        )}
      </div>
    </div>
  );
}
