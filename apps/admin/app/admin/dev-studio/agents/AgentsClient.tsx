'use client';

import { useEffect, useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  capabilities: string[];
  created_at: string;
}

export default function AgentsClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAgents() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/agents');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setAgents(json.agents ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAgents(); }, []);

  const STATUS_COLORS: Record<string, string> = {
    idle: 'bg-slate-400',
    active: 'bg-emerald-500',
    busy: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">AI Agents</h1>
            <p className="text-sm text-slate-500">Manage autonomous agents powering the Dev Studio</p>
          </div>
        </div>
        <button onClick={fetchAgents} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[agent.status] ?? 'bg-slate-400'}`} />
                <div>
                  <p className="font-semibold text-slate-900">{agent.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{agent.role.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                {agent.status}
              </span>
            </div>
            {agent.capabilities?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.capabilities.map((c) => (
                  <span key={c} className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    {c.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && agents.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
          <Bot className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Integration pending: ai_agents table migration not yet applied</p>
        </div>
      )}
    </div>
  );
}
