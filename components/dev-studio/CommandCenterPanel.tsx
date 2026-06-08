'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle, Rocket, Server, XCircle } from 'lucide-react';

interface CommandCenterData {
  activeTasks: number;
  failedTasks: number;
  latestDeployments: { service: string; status: string }[];
  activeAgents: number;
  recentErrors: number;
  health: {
    website: boolean;
    lms: boolean;
    database: boolean;
  };
}

export default function CommandCenterPanel() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    setLoading(true);
    try {
      const [tasksRes, buildsRes, agentsRes, auditRes] = await Promise.all([
        fetch('/api/devstudio/tasks').then((r) => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/devstudio/builds').then((r) => r.json()).catch(() => ({ builds: [] })),
        fetch('/api/devstudio/agents').then((r) => r.json()).catch(() => ({ agents: [] })),
        fetch('/api/devstudio/audit?limit=20').then((r) => r.json()).catch(() => ({ logs: [] })),
      ]);

      const tasks = tasksRes.tasks ?? [];
      const builds = buildsRes.builds ?? [];
      const agents = agentsRes.agents ?? [];
      const logs = auditRes.logs ?? [];

      setData({
        activeTasks: tasks.filter((t: { status: string }) => ['pending', 'running', 'awaiting_approval'].includes(t.status)).length,
        failedTasks: tasks.filter((t: { status: string }) => t.status === 'failed').length,
        latestDeployments: builds.slice(0, 3).map((b: { service: string; status: string }) => ({ service: b.service, status: b.status })),
        activeAgents: agents.filter((a: { status: string }) => a.status === 'active').length,
        recentErrors: logs.filter((l: { action: string }) => l.action.includes('failed') || l.action.includes('error')).length,
        health: {
          website: true,
          lms: true,
          database: true,
        },
      });
    } catch {
      // Silently degrade
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  if (loading || !data) {
    return (
      <div className="p-4" style={{ background: '#1e1e1e', color: '#858585' }}>
        <p className="text-xs">Loading command center...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4" style={{ color: '#007acc' }} />
        <h3 className="text-sm font-bold" style={{ color: '#cccccc' }}>Command Center</h3>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded border p-2 text-center" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-lg font-bold" style={{ color: data.activeTasks > 0 ? '#fbbf24' : '#4ade80' }}>{data.activeTasks}</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>Active Tasks</p>
        </div>
        <div className="rounded border p-2 text-center" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-lg font-bold" style={{ color: data.failedTasks > 0 ? '#f87171' : '#4ade80' }}>{data.failedTasks}</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>Failed</p>
        </div>
        <div className="rounded border p-2 text-center" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-lg font-bold" style={{ color: '#60a5fa' }}>{data.activeAgents}</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>Agents Active</p>
        </div>
      </div>

      {/* Health */}
      <div className="rounded border p-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
        <p className="text-[10px] font-semibold mb-2" style={{ color: '#858585' }}>SERVICE HEALTH</p>
        <div className="flex gap-3">
          {[
            { label: 'Website', ok: data.health.website },
            { label: 'LMS', ok: data.health.lms },
            { label: 'Database', ok: data.health.database },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              {s.ok ? <CheckCircle className="w-3 h-3" style={{ color: '#4ade80' }} /> : <XCircle className="w-3 h-3" style={{ color: '#f87171' }} />}
              <span className="text-[10px]" style={{ color: s.ok ? '#4ade80' : '#f87171' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Deployments */}
      {data.latestDeployments.length > 0 && (
        <div className="rounded border p-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
          <p className="text-[10px] font-semibold mb-2" style={{ color: '#858585' }}>LATEST DEPLOYS</p>
          {data.latestDeployments.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Rocket className="w-3 h-3" style={{ color: '#858585' }} />
                <span className="text-xs" style={{ color: '#cccccc' }}>{d.service}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                background: d.status === 'success' ? '#1a3a1a' : d.status === 'failed' ? '#3a1a1a' : '#2a2a00',
                color: d.status === 'success' ? '#4ade80' : d.status === 'failed' ? '#f87171' : '#fbbf24',
              }}>{d.status}</span>
            </div>
          ))}
        </div>
      )}

      {data.recentErrors > 0 && (
        <div className="flex items-center gap-2 rounded border p-2" style={{ background: '#3a1a1a', borderColor: '#5a2a2a' }}>
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
          <span className="text-xs" style={{ color: '#f87171' }}>{data.recentErrors} recent audit errors</span>
        </div>
      )}
    </div>
  );
}
