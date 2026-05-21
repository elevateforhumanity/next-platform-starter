'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Brain, Code2, BookOpen, BarChart3, Database, Search, Send, Loader2,
  Terminal, Zap, Activity, Map, GitBranch, Users, ShieldAlert, BookMarked,
  FileText, Briefcase,
} from 'lucide-react';

// Prompts that trigger the devstudio action executor (SSE streaming)
const ACTION_PATTERNS = [
  /scan.*route|route.*scan|list.*route|show.*route/i,
  /no.*auth.*route|missing.*auth|auth.*gap/i,
  /show.*table|list.*table/i,
  /audit.*system|system.*audit|full.*audit|run.*audit/i,
  /audit.*enrollment|enrollment.*audit|enrollment.*pipeline/i,
  /verify.*program|program.*integrity/i,
  /inspect.*student|student.*access/i,
  /platform.*state|get.*state|system.*health|health.*check/i,
  /knowledge.*graph|lookup.*graph|graph.*lookup/i,
  /recall.*memory|memory.*recall|past.*decision|known.*issue/i,
  /save.*memory|remember.*this/i,
  /list.*migration|pending.*migration/i,
  /run.*qa|qa.*scan|quality.*check|platform.*qa/i,
  /snapshot|rollback/i,
  /system.*registry|program.*registry|registry.*lookup/i,
  /broken.*link|inspect.*link|link.*check|dead.*link/i,
  /run.*migration|apply.*migration/i,
  /deploy|build.*project|run.*build/i,
  /generate.*course|create.*course|seed.*course/i,
  /list.*enrollment|show.*enrollment|enrollment.*count/i,
  /list.*application|show.*application|pending.*application/i,
  /list.*student|show.*student|student.*count/i,
  /list.*program|show.*program|program.*status/i,
  /recent.*commit|git.*log|commit.*history/i,
  /run.*report|generate.*report|show.*report/i,
  /list.*shop|show.*shop|partner.*shop/i,
  /send.*email|email.*student|notify/i,
  /social.*media|post.*to|publish.*to|create.*post|generate.*post|write.*post/i,
  /facebook.*post|instagram.*post|twitter.*post|linkedin.*post|youtube.*post/i,
  /post.*facebook|post.*instagram|post.*twitter|post.*linkedin/i,
  /social.*connect|connect.*social|social.*account|check.*social/i,
  /generate.*reel|create.*reel|make.*reel|write.*caption/i,
  /run.*payroll|payroll.*run/i,
];

function isActionPrompt(text: string): boolean {
  return ACTION_PATTERNS.some(p => p.test(text));
}

interface Message {
  role: 'user' | 'assistant' | 'action';
  content: string;
  streaming?: boolean;
}

interface PlatformState {
  platform?: {
    active_students: number | null;
    pending_applications: number | null;
    total_enrollments: number | null;
    published_programs: number | null;
    certificates_issued: number | null;
  };
  deployment?: {
    ai_provider: string;
    environment: string;
  };
  debt?: {
    total_items: number;
    by_severity: { high: number; medium: number; low: number };
  };
}

const QUICK_ACTIONS = [
  { icon: Activity,    label: 'Platform state',      prompt: 'Get live platform state',                        mode: 'action' },
  { icon: Map,         label: 'Knowledge graph',      prompt: 'Lookup knowledge graph systems',                 mode: 'action' },
  { icon: ShieldAlert, label: 'Auth audit',           prompt: 'Run full system audit',                          mode: 'action' },
  { icon: BarChart3,   label: 'Enrollment pipeline',  prompt: 'Audit enrollment pipeline',                      mode: 'action' },
  { icon: Database,    label: 'Active programs',       prompt: 'List all active published programs',              mode: 'action' },
  { icon: Users,       label: 'Pending applications', prompt: 'List pending applications',                      mode: 'action' },
  { icon: BookMarked,  label: 'Recall memory',        prompt: 'Recall operational memory type=all',             mode: 'action' },
  { icon: GitBranch,   label: 'Migrations',           prompt: 'List pending migrations',                        mode: 'action' },
  { icon: Search,      label: 'Scan routes',          prompt: 'Scan all Next.js routes',                        mode: 'action' },
  { icon: Code2,       label: 'Recent commits',       prompt: 'Show recent git commits',                        mode: 'action' },
  { icon: BookOpen,    label: 'List programs',        prompt: 'List all active published programs',             mode: 'action' },
  { icon: Zap,         label: 'Full QA scan',         prompt: 'Run full platform QA scan',                      mode: 'action' },
  { icon: Briefcase,   label: 'Grant applications',   prompt: 'List all grant applications and their status',   mode: 'action' },
  { icon: FileText,    label: 'Contract pipeline',    prompt: 'List all contract templates and pipeline status', mode: 'action' },
];

export default function AiConsoleClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [platformState, setPlatformState] = useState<PlatformState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load platform state on mount
  useEffect(() => {
    fetch('/api/devstudio/platform-state')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPlatformState(data); })
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const prompt = text.trim();
    if (!prompt || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);

    const useAction = isActionPrompt(prompt);

    if (useAction) {
      // Stream from devstudio execute endpoint
      setMessages(prev => [...prev, { role: 'action', content: '', streaming: true }]);
      try {
        const res = await fetch('/api/devstudio/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: prompt }),
        });
        if (!res.body) throw new Error('No stream');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const payload = line.slice(6);
              if (payload === '[DONE]') break;
              try {
                const { text } = JSON.parse(payload);
                if (text) {
                  setMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'action') {
                      updated[updated.length - 1] = {
                        ...last,
                        content: last.content + (last.content ? '\n' : '') + text,
                      };
                    }
                    return updated;
                  });
                }
              } catch { /* non-JSON line */ }
            }
          }
        }
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'action') updated[updated.length - 1] = { ...last, streaming: false };
          return updated;
        });
      } catch (err) {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'action') {
            updated[updated.length - 1] = {
              ...last,
              content: `Error: ${err instanceof Error ? err.message : 'Request failed'}`,
              streaming: false,
            };
          }
          return updated;
        });
      }
    } else {
      // Q&A mode — assistant endpoint
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
      try {
        const history = messages
          .filter(m => !m.streaming)
          .slice(-10)
          .map(m => ({ role: m.role === 'action' ? 'assistant' : m.role, content: m.content }));

        const res = await fetch('/api/admin/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, history }),
        });
        const data = await res.json();
        const reply = data.reply ?? data.message ?? data.content ?? JSON.stringify(data);
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { role: 'assistant', content: reply, streaming: false };
          }
          return updated;
        });
      } catch (err) {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `Error: ${err instanceof Error ? err.message : 'Request failed'}`,
              streaming: false,
            };
          }
          return updated;
        });
      }
    }

    setLoading(false);
    inputRef.current?.focus();
  }, [loading, messages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Strip ANSI escape codes for display
  const stripAnsi = (str: string) => {
    let out = '';
    let i = 0;
    while (i < str.length) {
      const ch = str.charCodeAt(i);
      if (ch === 27 && str[i + 1] === '[') {
        i += 2;
        while (i < str.length && str[i] !== 'm') i++;
        if (i < str.length) i++;
        continue;
      }
      out += str[i];
      i++;
    }
    return out;
  };

  // Colorize ANSI for terminal output
  const renderTerminal = (content: string) => {
    return content.split('\n').map((line, i) => {
      const stripped = stripAnsi(line);
      let cls = 'text-slate-300';
      if (line.includes('\x1b[32m') || line.includes('✓')) cls = 'text-green-400';
      else if (line.includes('\x1b[31m') || line.includes('✗')) cls = 'text-red-400';
      else if (line.includes('\x1b[33m') || line.includes('⚙') || line.includes('⚠')) cls = 'text-amber-400';
      else if (line.includes('\x1b[90m') || line.startsWith('   $')) cls = 'text-slate-500';
      else if (line.startsWith('   ')) cls = 'text-slate-400';
      return <div key={i} className={cls}>{stripped || '\u00a0'}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Platform state strip */}
      {platformState && (
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 text-xs font-mono text-slate-300 border-b border-slate-700 overflow-x-auto shrink-0">
          <span className="text-slate-500 shrink-0">LIVE</span>
          {platformState.platform?.active_students != null && (
            <span className="shrink-0"><span className="text-slate-500">students </span><span className="text-green-400">{platformState.platform.active_students}</span></span>
          )}
          {platformState.platform?.pending_applications != null && (
            <span className="shrink-0"><span className="text-slate-500">pending-apps </span><span className={platformState.platform.pending_applications > 0 ? 'text-amber-400' : 'text-green-400'}>{platformState.platform.pending_applications}</span></span>
          )}
          {platformState.platform?.total_enrollments != null && (
            <span className="shrink-0"><span className="text-slate-500">enrollments </span><span className="text-blue-400">{platformState.platform.total_enrollments}</span></span>
          )}
          {platformState.platform?.published_programs != null && (
            <span className="shrink-0"><span className="text-slate-500">programs </span><span className="text-slate-300">{platformState.platform.published_programs}</span></span>
          )}
          {platformState.debt && (
            <span className="shrink-0"><span className="text-slate-500">debt </span><span className={platformState.debt.by_severity.high > 0 ? 'text-red-400' : 'text-slate-300'}>{platformState.debt.by_severity.high}H/{platformState.debt.by_severity.medium}M</span></span>
          )}
          {platformState.deployment?.ai_provider && (
            <span className="shrink-0 ml-auto"><span className="text-slate-500">ai </span><span className="text-purple-400">{platformState.deployment.ai_provider}</span></span>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-slate-200 bg-slate-50">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => sendMessage(a.prompt)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors disabled:opacity-50"
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-600 mb-1">Elevate Platform Operator</p>
            <p className="text-sm">Ask questions about live data, or give action commands to scan routes, query the DB, audit the system, and more.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'action' ? (
              <div className="w-full bg-slate-900 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                {msg.streaming && msg.content === '' ? (
                  <div className="flex items-center gap-2 text-amber-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing…</span>
                  </div>
                ) : (
                  <>
                    {renderTerminal(msg.content)}
                    {msg.streaming && (
                      <div className="flex items-center gap-1 text-amber-400 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : msg.role === 'user' ? (
              <div className="max-w-[80%] bg-brand-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 leading-relaxed">
                {msg.streaming && msg.content === '' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question or give a command… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-brand-blue-600 text-white rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">
          Action commands stream live from the platform. Q&amp;A queries live data via the assistant.
          <Link href="/admin/dev-studio" className="ml-2 text-brand-blue-500 hover:underline">Open Dev Studio →</Link>
        </p>
      </div>
    </div>
  );
}
