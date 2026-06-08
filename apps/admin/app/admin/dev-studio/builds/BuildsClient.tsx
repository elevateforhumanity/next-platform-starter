'use client';

import { useEffect, useState } from 'react';
import { Hammer, RefreshCw, Play } from 'lucide-react';

interface Build {
  id: string;
  service: string;
  environment: string;
  status: string;
  commit_sha: string | null;
  started_at: string;
  completed_at: string | null;
}

export default function BuildsClient() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  async function fetchBuilds() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/builds');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setBuilds(json.builds ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function triggerBuild(service: string) {
    setTriggering(true);
    try {
      await fetch('/api/devstudio/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      });
      fetchBuilds();
    } finally {
      setTriggering(false);
    }
  }

  useEffect(() => { fetchBuilds(); }, []);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-slate-400',
    building: 'bg-amber-400',
    deploying: 'bg-blue-400',
    success: 'bg-emerald-400',
    failed: 'bg-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Hammer className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Builds & Deploy</h1>
            <p className="text-sm text-slate-500">Trigger and monitor Northflank deployments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => triggerBuild('admin')} disabled={triggering}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
            <Play className="h-3.5 w-3.5" /> Deploy Admin
          </button>
          <button onClick={() => triggerBuild('lms')} disabled={triggering}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition">
            <Play className="h-3.5 w-3.5" /> Deploy LMS
          </button>
          <button onClick={fetchBuilds} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Northflank deploy requires <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">NORTHFLANK_API_TOKEN</code> env var. Builds are recorded regardless.
      </div>

      <div className="space-y-3">
        {builds.map((b) => (
          <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 capitalize">{b.service} — {b.environment}</p>
                {b.commit_sha && <p className="text-xs font-mono text-slate-500 mt-0.5">{b.commit_sha.slice(0, 8)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-slate-400'}`} />
                <span className="text-xs font-medium text-slate-600 capitalize">{b.status}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{new Date(b.started_at).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {!loading && builds.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
          <Hammer className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Integration pending: ai_deployments table migration not yet applied</p>
        </div>
      )}
    </div>
  );
}
