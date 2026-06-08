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
    idle: 'bg-slate-500',
    active: 'bg-green-500',
    busy: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>AI Agents</h1>
        </div>
        <button onClick={fetchAgents} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>
          {error}
        </div>
      )}

      <div className="grid gap-3">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-lg border p-4" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[agent.status] ?? 'bg-slate-500'}`} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#cccccc' }}>{agent.name}</p>
                  <p className="text-xs" style={{ color: '#858585' }}>{agent.role}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#333', color: '#8b8' }}>{agent.status}</span>
            </div>
            {agent.capabilities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities.map((c) => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1a3a5c', color: '#6cb6ff' }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && agents.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>
            Integration pending: ai_agents table migration not yet applied
          </p>
        )}
      </div>
    </div>
  );
}
