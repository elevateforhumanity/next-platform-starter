'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
    <div className="min-h-screen bg-white">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image src="/images/pages/admin-ai-tutor-logs-hero.webp" alt="Audit Logs" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-red-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">Audit Trail</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Dev Audit Logs</h1>
            <p className="text-orange-100 text-lg mt-2 max-w-2xl">Complete chronological record of every action in the Dev Studio.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-slate-500">{logs.length} log entries — newest first</p>
          <button onClick={fetchLogs} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-6">{error}</div>}

        <div className="relative space-y-3">
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-slate-200" />
          {logs.map((log) => (
            <div key={log.id} className="relative pl-12">
              <div className="absolute left-2 top-4 h-5 w-5 rounded-full bg-orange-100 ring-4 ring-white flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-800">{log.action}</span>
                  <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.resource_type && <p className="text-xs text-slate-500 mt-1">Resource: {log.resource_type} {log.resource_id ? `(${log.resource_id.slice(0, 8)})` : ''}</p>}
              </div>
            </div>
          ))}
        </div>

        {!loading && logs.length === 0 && !error && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No audit logs yet</p>
            <p className="text-xs text-slate-400 mt-1">Integration pending: dev_audit_logs table migration not yet applied</p>
          </div>
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>No audit logs yet — actions in Dev Studio are recorded here automatically</p>
        )}
      </div>
    </div>
  );
}
