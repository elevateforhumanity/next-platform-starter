'use client';

import { useEffect, useState } from 'react';
import { ListTodo, RefreshCw, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  requires_approval: boolean;
  approval_reason: string | null;
  ai_agents: { name: string; role: string } | null;
  created_at: string;
}

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/devstudio/tasks');
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTasks(json.tasks ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function approveTask(id: string) {
    await fetch(`/api/devstudio/tasks/${id}/approve`, { method: 'POST' });
    fetchTasks();
  }

  async function rollbackTask(id: string) {
    await fetch(`/api/devstudio/tasks/${id}/rollback`, { method: 'POST' });
    fetchTasks();
  }

  useEffect(() => { fetchTasks(); }, []);

  const STATUS_ICON: Record<string, typeof Clock> = {
    pending: Clock,
    awaiting_approval: ShieldAlert,
    approved: CheckCircle,
    running: RefreshCw,
    completed: CheckCircle,
    failed: XCircle,
    rolled_back: XCircle,
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#1e1e1e' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ListTodo className="w-5 h-5" style={{ color: '#007acc' }} />
          <h1 className="text-xl font-bold" style={{ color: '#cccccc' }}>AI Tasks</h1>
        </div>
        <button onClick={fetchTasks} className="p-2 rounded hover:bg-[#333]" style={{ color: '#cccccc' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded border px-4 py-3 mb-4 text-sm" style={{ borderColor: '#f44', background: '#2a1a1a', color: '#f88' }}>
          {error}
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => {
          const Icon = STATUS_ICON[task.status] ?? Clock;
          return (
            <div key={task.id} className="rounded-lg border p-4" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: task.status === 'awaiting_approval' ? '#f59e0b' : '#858585' }} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#cccccc' }}>{task.title}</p>
                    {task.ai_agents && <p className="text-xs mt-0.5" style={{ color: '#858585' }}>Agent: {task.ai_agents.name}</p>}
                    {task.approval_reason && (
                      <p className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{ background: '#3a2a00', color: '#fbbf24' }}>
                        {task.approval_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'awaiting_approval' && (
                    <>
                      <button onClick={() => approveTask(task.id)} className="text-xs px-2 py-1 rounded" style={{ background: '#1a3a1a', color: '#4ade80' }}>Approve</button>
                      <button onClick={() => rollbackTask(task.id)} className="text-xs px-2 py-1 rounded" style={{ background: '#3a1a1a', color: '#f87171' }}>Reject</button>
                    </>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#333', color: '#aaa' }}>{task.status}</span>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && tasks.length === 0 && !error && (
          <p className="text-sm text-center py-8" style={{ color: '#858585' }}>
            No tasks yet — create one from the Studio chat or trigger an agent action
          </p>
        )}
      </div>
    </div>
  );
}
