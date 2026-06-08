'use client';

import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Plus } from 'lucide-react';

interface Memory {
  id: string;
  agent_id: string | null;
  category: string;
  key: string;
  value: string;
  updated_at: string;
}

export default function MemoryClient() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  async function fetchMemories() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/memory');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMemories(json.memories ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function addMemory() {
    if (!newKey || !newValue) return;
    await fetch('/api/devstudio/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey, value: newValue, category: 'manual' }),
    });
    setNewKey('');
    setNewValue('');
    fetchMemories();
  }

  useEffect(() => { fetchMemories(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
            <Brain className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">AI Memory</h1>
            <p className="text-sm text-slate-500">Persistent knowledge store for AI agents</p>
          </div>
        </div>
        <button onClick={fetchMemories} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Add memory form */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-700 mb-3">Store New Memory</p>
        <div className="flex gap-2">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value"
            className="flex-[2] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <button onClick={addMemory} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
            <Plus className="h-3.5 w-3.5" /> Store
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-3">
        {memories.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-sm font-semibold text-teal-700">{m.key}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 capitalize">{m.category}</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.value}</p>
          </div>
        ))}
      </div>

      {!loading && memories.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
          <Brain className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Integration pending: ai_memory table migration not yet applied</p>
        </div>
      )}
    </div>
  );
}
