'use client';

import { useEffect, useState } from 'react';
import { Rocket, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Deployment {
  id: string;
  service: string;
  environment: string;
  status: string;
  commit_sha: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function DeploymentsClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDeployments() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/builds');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setDeployments(json.builds ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDeployments(); }, []);

  const STATUS_ICONS: Record<string, typeof Clock> = {
    success: CheckCircle,
    failed: XCircle,
    pending: Clock,
    building: Clock,
    deploying: Rocket,
  };

  const STATUS_COLORS: Record<string, string> = {
    success: 'text-emerald-500',
    failed: 'text-red-500',
    pending: 'text-slate-400',
    building: 'text-amber-500',
    deploying: 'text-blue-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
            <Rocket className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Deployments</h1>
            <p className="text-sm text-slate-500">Production deployment history</p>
          </div>
        </div>
        <button onClick={fetchDeployments} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-3">
        {deployments.map((d) => {
          const Icon = STATUS_ICONS[d.status] ?? Clock;
          const color = STATUS_COLORS[d.status] ?? 'text-slate-400';
          return (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div>
                    <p className="font-medium text-slate-900 capitalize">{d.service}</p>
                    <p className="text-xs text-slate-500">{d.environment}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-600 capitalize">{d.status}</span>
                  {d.commit_sha && <p className="text-[10px] font-mono text-slate-400">{d.commit_sha.slice(0, 8)}</p>}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{new Date(d.started_at).toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {!loading && deployments.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
          <Rocket className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Integration pending: ai_deployments table migration not yet applied</p>
        </div>
      )}
    </div>
  );
}
