'use client';

/**
 * ServicesPanel — self-contained service management panel for Dev Studio.
 *
 * Shows ECS service health + HTTP health check results for LMS, Admin, and
 * Studio Shell. Supports start / stop / restart / deploy actions via
 * /api/devstudio/services.
 *
 * No Gitpod dependency — works anywhere the admin app runs.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, AlertCircle, Circle, Play, Square,
  RotateCcw, ExternalLink, Loader2, Clock, Terminal,
} from 'lucide-react';

interface ServiceHealth {
  ok: boolean;
  latencyMs: number;
  status: number | null;
}

interface EcsInfo {
  runningCount: number;
  desiredCount: number;
  status: string;
  lastDeployedAt: string | null;
  taskDefinition: string;
}

interface Service {
  key: string;
  label: string;
  ecsService: string;
  url: string | null;
  color: string;
  ecs: EcsInfo | null;
  health: ServiceHealth | null;
  running: boolean | null;
  healthy: boolean | null;
  hasAws: boolean;
  reason?: string;
}

interface ServicesData {
  services: Service[];
  cluster: string;
  fetchedAt: string;
}

type ActionState = Record<string, 'idle' | 'loading' | 'done' | 'error'>;

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  green:  'bg-green-500',
};

function StatusDot({ running, healthy }: { running: boolean | null; healthy: boolean | null }) {
  if (running === null) return <Circle className="w-3 h-3 text-slate-300" />;
  if (!running) return <Circle className="w-3 h-3 text-slate-400" />;
  if (healthy) return <CheckCircle className="w-3 h-3 text-green-500" />;
  return <AlertCircle className="w-3 h-3 text-amber-500" />;
}

function StatusLabel({ running, healthy, ecs }: { running: boolean | null; healthy: boolean | null; ecs: EcsInfo | null }) {
  if (running === null && !ecs) return <span className="text-xs text-slate-400">Unknown</span>;
  if (ecs?.status === 'NOT_FOUND') return <span className="text-xs text-slate-400">Not deployed</span>;
  if (!running && ecs) return <span className="text-xs text-slate-500">Stopped ({ecs.desiredCount} desired)</span>;
  if (running && !healthy) return <span className="text-xs text-amber-600">Running · health check failing</span>;
  if (running && healthy) return <span className="text-xs text-green-600">Running · healthy</span>;
  if (running) return <span className="text-xs text-green-600">Running</span>;
  return <span className="text-xs text-slate-400">Stopped</span>;
}

export default function ServicesPanel() {
  const [data, setData]         = useState<ServicesData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actions, setActions]   = useState<ActionState>({});
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/devstudio/services');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(serviceKey: string, action: string) {
    setActions(prev => ({ ...prev, [serviceKey + action]: 'loading' }));
    setActionMsg(prev => ({ ...prev, [serviceKey]: '' }));
    try {
      const res = await fetch('/api/devstudio/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, service: serviceKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setActions(prev => ({ ...prev, [serviceKey + action]: 'done' }));
      setActionMsg(prev => ({ ...prev, [serviceKey]: actionLabel(action) + ' triggered' }));
      // Refresh after a short delay
      setTimeout(load, 3000);
    } catch (e) {
      setActions(prev => ({ ...prev, [serviceKey + action]: 'error' }));
      setActionMsg(prev => ({ ...prev, [serviceKey]: e instanceof Error ? e.message : 'Action failed' }));
    }
  }

  function actionLabel(action: string) {
    return { start: 'Start', stop: 'Stop', restart: 'Restart', deploy: 'Deploy' }[action] ?? action;
  }

  function isLoading(serviceKey: string, action: string) {
    return actions[serviceKey + action] === 'loading';
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-200 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <p className="text-sm font-semibold text-white">Services</p>
          {data && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              Cluster: {data.cluster} · {new Date(data.fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading services…
          </div>
        )}

        {data?.services.map(svc => (
          <div key={svc.key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">

            {/* Service header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <div className={`w-2 h-2 rounded-full ${COLOR_MAP[svc.color] ?? 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{svc.label}</p>
                  <StatusDot running={svc.running} healthy={svc.healthy} />
                </div>
                <StatusLabel running={svc.running} healthy={svc.healthy} ecs={svc.ecs} />
              </div>
              {svc.url && (
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                  title="Open site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* ECS details */}
            {svc.ecs && (
              <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                <div className="px-3 py-2 text-center">
                  <p className="text-lg font-bold text-white">{svc.ecs.runningCount}</p>
                  <p className="text-[10px] text-slate-500">Running</p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-lg font-bold text-white">{svc.ecs.desiredCount}</p>
                  <p className="text-[10px] text-slate-500">Desired</p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-lg font-bold text-white">{svc.ecs.pendingCount ?? 0}</p>
                  <p className="text-[10px] text-slate-500">Pending</p>
                </div>
              </div>
            )}

            {/* Health check */}
            {svc.health && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 text-xs">
                {svc.health.ok
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                }
                <span className={svc.health.ok ? 'text-green-400' : 'text-red-400'}>
                  HTTP {svc.health.status ?? 'timeout'}
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {svc.health.latencyMs}ms
                </span>
              </div>
            )}

            {/* Last deployed */}
            {svc.ecs?.lastDeployedAt && (
              <div className="px-4 py-2 border-b border-white/5 text-[10px] text-slate-500">
                Last deployed: {new Date(svc.ecs.lastDeployedAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  timeZone: 'America/Indiana/Indianapolis',
                })} ET
              </div>
            )}

            {/* Action message */}
            {actionMsg[svc.key] && (
              <div className="px-4 py-2 text-xs text-amber-400 border-b border-white/5">
                {actionMsg[svc.key]}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
              {/* Start */}
              <button
                onClick={() => doAction(svc.key, 'start')}
                disabled={isLoading(svc.key, 'start') || svc.running === true}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-40 transition-colors"
              >
                {isLoading(svc.key, 'start') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Start
              </button>

              {/* Stop */}
              <button
                onClick={() => doAction(svc.key, 'stop')}
                disabled={isLoading(svc.key, 'stop') || svc.running === false}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-40 transition-colors"
              >
                {isLoading(svc.key, 'stop') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                Stop
              </button>

              {/* Restart */}
              <button
                onClick={() => doAction(svc.key, 'restart')}
                disabled={isLoading(svc.key, 'restart')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-40 transition-colors"
              >
                {isLoading(svc.key, 'restart') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Restart
              </button>

              {/* Deploy — force-new-deployment with latest ECR image */}
              <button
                onClick={() => doAction(svc.key, 'deploy')}
                disabled={isLoading(svc.key, 'deploy')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-40 transition-colors"
              >
                {isLoading(svc.key, 'deploy') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Deploy
              </button>
            </div>

            {!svc.hasAws && (
              <div className="px-4 pb-3 text-[10px] text-slate-500">
                AWS credentials not configured — start/stop/restart unavailable
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
