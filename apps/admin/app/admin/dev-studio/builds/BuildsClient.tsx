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
    pending: '#858585',
    building: '#fbbf24',
    deploying: '#60a5fa',
    success: '#4ade80',
    failed: '#f87171',
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Hammer className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>Builds & Deployments</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => triggerBuild('admin')} disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold" style={{ background: '#007acc', color: '#fff' }}>
            <Play className="w-3 h-3" /> Deploy Admin
          </button>
          <button onClick={() => triggerBuild('lms')} disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold" style={{ background: '#1a5c1a', color: '#4ade80' }}>
            <Play className="w-3 h-3" /> Deploy LMS
          </button>
          <button onClick={fetchBuilds} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>{error}</div>}

      {!process.env.NEXT_PUBLIC_NORTHFLANK_CONFIGURED && (
        <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#3c3c3c', background: '#252526', color: '#fbbf24' }}>
          NORTHFLANK_API_TOKEN not configured — builds will record locally but not trigger Northflank deploys
        </div>
      )}

      <div className="space-y-2">
        {builds.map((b) => (
          <div key={b.id} className="rounded-lg border p-4" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: '#cccccc' }}>{b.service} — {b.environment}</p>
                {b.commit_sha && <p className="text-xs font-mono mt-0.5" style={{ color: '#858585' }}>{b.commit_sha.slice(0, 8)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[b.status] ?? '#858585' }} />
                <span className="text-xs" style={{ color: STATUS_COLORS[b.status] ?? '#858585' }}>{b.status}</span>
              </div>
            </div>
            <p className="text-[10px] mt-2" style={{ color: '#555' }}>{new Date(b.started_at).toLocaleString()}</p>
          </div>
        ))}
        {!loading && builds.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>No builds yet — click Deploy Admin or Deploy LMS to start</p>
        )}
      </div>
    </div>
  );
}
