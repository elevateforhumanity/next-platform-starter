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

  const STATUS_STYLES: Record<string, { icon: typeof Clock; color: string }> = {
    pending: { icon: Clock, color: 'text-slate-400' },
    awaiting_approval: { icon: ShieldAlert, color: 'text-amber-500' },
    approved: { icon: CheckCircle, color: 'text-blue-500' },
    running: { icon: RefreshCw, color: 'text-blue-500' },
    completed: { icon: CheckCircle, color: 'text-emerald-500' },
    failed: { icon: XCircle, color: 'text-red-500' },
    rolled_back: { icon: XCircle, color: 'text-slate-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <ListTodo className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">AI Tasks</h1>
            <p className="text-sm text-slate-500">Monitor and manage autonomous task execution</p>
          </div>
        </div>
        <button onClick={fetchTasks} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending;
          const Icon = style.icon;
          return (
            <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${style.color}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{task.title}</p>
                    {task.ai_agents && <p className="text-xs text-slate-500 mt-0.5">Agent: {task.ai_agents.name}</p>}
                    {task.approval_reason && (
                      <p className="mt-1.5 inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700 border border-amber-200">
                        {task.approval_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'awaiting_approval' && (
                    <>
                      <button onClick={() => approveTask(task.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition">
                        Approve
                      </button>
                      <button onClick={() => rollbackTask(task.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition">
                        Reject
                      </button>
                    </>
                  )}
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && tasks.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Integration pending: ai_tasks table migration not yet applied</p>
        </div>
      )}
    </div>
  );
}
