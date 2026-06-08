'use client';

import { useEffect, useState } from 'react';
import { Settings, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface HealthStatus {
  hasGroq: boolean;
  hasGemini: boolean;
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasGitHub: boolean;
  aiConfigured: boolean;
  shell: { configured: boolean; ready: boolean };
}

export default function SettingsClient() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/health');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setHealth(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchHealth(); }, []);

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 py-2 px-3 rounded" style={{ background: '#252526', border: '1px solid #3c3c3c' }}>
      {ok ? <CheckCircle className="w-4 h-4" style={{ color: '#4ade80' }} /> : <XCircle className="w-4 h-4" style={{ color: '#f87171' }} />}
      <span className="text-sm" style={{ color: ok ? '#4ade80' : '#f87171' }}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>Dev Studio Settings</h1>
        </div>
        <button onClick={fetchHealth} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>{error}</div>}

      {health && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#858585' }}>AI Providers</h2>
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge ok={health.hasGroq} label="Groq" />
              <StatusBadge ok={health.hasGemini} label="Gemini" />
              <StatusBadge ok={health.hasOpenAI} label="OpenAI" />
              <StatusBadge ok={health.hasAnthropic} label="Anthropic" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#858585' }}>Infrastructure</h2>
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge ok={health.hasGitHub} label="GitHub Token" />
              <StatusBadge ok={health.shell?.configured ?? false} label="Shell WS" />
              <StatusBadge ok={health.shell?.ready ?? false} label="Shell Ready" />
              <StatusBadge ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL} label="Supabase" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#858585' }}>Northflank Deployment</h2>
            <div className="rounded border p-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
              <p className="text-xs" style={{ color: '#cccccc' }}>
                Deploy is triggered via <code className="font-mono" style={{ color: '#4ec9b0' }}>process.env.NORTHFLANK_API_TOKEN</code>.
                Ensure this is set in your Northflank service environment.
              </p>
            </div>
          </div>
        </div>
      )}

      {!health && !loading && !error && (
        <p className="text-sm text-center py-8" style={{ color: '#858585' }}>Health check unavailable — verify /api/devstudio/health endpoint is deployed</p>
      )}
    </div>
  );
}
