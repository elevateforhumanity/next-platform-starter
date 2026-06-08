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
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>AI Memory</h1>
        </div>
        <button onClick={fetchMemories} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Add memory */}
      <div className="rounded-lg border p-4 mb-4" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
        <div className="flex gap-2">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key"
            className="flex-1 rounded px-3 py-1.5 text-sm outline-none" style={{ background: '#1e1e1e', color: '#ccc', border: '1px solid #3c3c3c' }} />
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value"
            className="flex-[2] rounded px-3 py-1.5 text-sm outline-none" style={{ background: '#1e1e1e', color: '#ccc', border: '1px solid #3c3c3c' }} />
          <button onClick={addMemory} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold" style={{ background: '#007acc', color: '#fff' }}>
            <Plus className="w-3 h-3" /> Store
          </button>
        </div>
      </div>

      {error && <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>{error}</div>}

      <div className="space-y-2">
        {memories.map((m) => (
          <div key={m.id} className="rounded-lg border p-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold" style={{ color: '#4ec9b0' }}>{m.key}</span>
              <span className="text-[10px]" style={{ color: '#858585' }}>{m.category}</span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#cccccc' }}>{m.value}</p>
          </div>
        ))}
        {!loading && memories.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>No memories stored yet — add key-value pairs above or let agents store context</p>
        )}
      </div>
    </div>
  );
}
