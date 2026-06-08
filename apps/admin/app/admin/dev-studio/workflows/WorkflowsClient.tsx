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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Workflow className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Workflows</h1>
            <p className="text-sm text-slate-500">Automated task execution pipelines</p>
          </div>
        </div>
        <button onClick={fetchWorkflows} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-3">
        {workflows.map((w) => (
          <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{w.title}</p>
                {w.ai_agents && <p className="text-xs text-slate-500 mt-0.5">Agent: {w.ai_agents.name}</p>}
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                {w.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!loading && workflows.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
          <Workflow className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Integration pending: ai_tasks table migration not yet applied</p>
        </div>
      )}
    </div>
  );
}
