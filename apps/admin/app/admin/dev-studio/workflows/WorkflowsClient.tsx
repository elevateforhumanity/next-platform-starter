'use client';

import { useEffect, useState } from 'react';
import { Workflow, RefreshCw } from 'lucide-react';

interface WorkflowItem {
  id: string;
  title: string;
  status: string;
  ai_agents: { name: string; role: string } | null;
  updated_at: string;
}

export default function WorkflowsClient() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/workflows');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setWorkflows(json.workflows ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWorkflows(); }, []);

  return (
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Workflow className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>Workflows</h1>
        </div>
        <button onClick={fetchWorkflows} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>{error}</div>}

      <div className="space-y-2">
        {workflows.map((w) => (
          <div key={w.id} className="rounded-lg border p-4" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: '#cccccc' }}>{w.title}</p>
                {w.ai_agents && <p className="text-xs mt-0.5" style={{ color: '#858585' }}>Agent: {w.ai_agents.name}</p>}
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#333', color: '#aaa' }}>{w.status}</span>
            </div>
          </div>
        ))}
        {!loading && workflows.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>No workflows yet — workflows are created when multi-step tasks run</p>
        )}
      </div>
    </div>
  );
}
