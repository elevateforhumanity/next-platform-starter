'use client';

import { useEffect, useState } from 'react';
import { Rocket, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Deployment {
  id: string;
  service: string;
  environment: string;
  status: string;
  commit_sha: string | null;
  health_check: Record<string, unknown> | null;
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

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} />;
    if (status === 'failed') return <XCircle className="w-4 h-4" style={{ color: '#f87171' }} />;
    return <Clock className="w-4 h-4" style={{ color: '#fbbf24' }} />;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Rocket className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>Deployment History</h1>
        </div>
        <button onClick={fetchDeployments} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>{error}</div>}

      <div className="space-y-2">
        {deployments.map((d) => (
          <div key={d.id} className="rounded-lg border p-4" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon status={d.status} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#cccccc' }}>{d.service}</p>
                  <p className="text-xs" style={{ color: '#858585' }}>{d.environment} {d.commit_sha ? `• ${d.commit_sha.slice(0, 8)}` : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#858585' }}>{new Date(d.started_at).toLocaleString()}</p>
                {d.completed_at && <p className="text-[10px]" style={{ color: '#555' }}>Completed: {new Date(d.completed_at).toLocaleString()}</p>}
              </div>
            </div>
          </div>
        ))}
        {!loading && deployments.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>No deployments yet — trigger a deploy from the Builds page</p>
        )}
      </div>
    </div>
  );
}
