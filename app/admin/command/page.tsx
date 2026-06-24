'use client';

import { useState, useRef, useEffect } from 'react';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import {
  Send,
  Terminal,
  Loader2,
  User,
  Bot,
  AlertCircle,
  CheckCircle,
  Trash2,
  Copy,
  Clock,
} from 'lucide-react';

interface Command {
  id: string;
  input: string;
  output: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export default function CommandCenterPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Command[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commands]);

  async function executeCommand(cmd: string) {
    if (!cmd.trim()) return;

    const newCmd: Command = {
      id: Date.now().toString(),
      input: cmd,
      output: '',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    setCommands(prev => [...prev, newCmd]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/command/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await response.json();

      setCommands(prev =>
        prev.map(c =>
          c.id === newCmd.id
            ? { ...c, output: data.output || data.error || 'Command executed', status: response.ok ? 'success' : 'error' }
            : c
        )
      );
    } catch (error) {
      setCommands(prev =>
        prev.map(c =>
          c.id === newCmd.id
            ? { ...c, output: 'Error: Network failure', status: 'error' }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setHistory(prev => [...prev, ...commands]);
    setCommands([]);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Dev Studio', href: '/admin/studio' },
            { label: 'Command Center' },
          ]}
        />

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-6">
            <Terminal className="h-8 w-8 text-brand-orange-500" />
            <div>
              <h1 className="text-2xl font-bold">Command Center</h1>
              <p className="text-slate-400 text-sm">AI-powered platform operations interface</p>
            </div>
          </div>

          {/* Command History */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                <span>{commands.length} commands this session</span>
              </div>
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-3">
              {commands.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a command below to get started</p>
                </div>
              )}

              {commands.map(cmd => (
                <div key={cmd.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-brand-orange-500 mt-1 flex-shrink-0" />
                    <code className="text-sm text-green-400 font-mono bg-slate-900 px-2 py-1 rounded">
                      {cmd.input}
                    </code>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bot className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div className={`text-sm font-mono bg-slate-900 px-3 py-2 rounded flex-1 ${cmd.status === 'error' ? 'text-red-400 border border-red-900' : 'text-slate-300'}`}>
                      {cmd.status === 'pending' ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Executing...
                        </span>
                      ) : cmd.output}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Command Input */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && executeCommand(input)}
                  placeholder="Enter command or question..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange-500"
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => executeCommand(input)}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Executing
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Execute
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Quick commands:</span>
              {['Show system health', 'List recent deployments', 'Check database status', 'View error logs'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => executeCommand(cmd)}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Connected to platform</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>AI assistant ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
