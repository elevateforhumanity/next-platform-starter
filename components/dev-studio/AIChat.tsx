'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Loader2, Copy, Check, Sparkles, Paperclip,
  AlertTriangle, CheckCircle2, Database, Terminal, Zap, ChevronDown, ChevronRight,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { tool: string; args: Record<string, unknown>; result: string }[];
}

interface AIChatProps {
  fileContext?: string;
  onApplyCode?: (filename: string, code: string) => void;
}

const TOOL_META: Record<string, { label: string; color: string; icon: React.ElementType<{ className?: string }> }> = {
  list_programs:           { label: 'Programs',     color: 'text-brand-blue-700',  icon: Database },
  list_enrollments:        { label: 'Enrollments',  color: 'text-green-700',       icon: Database },
  get_dashboard_stats:     { label: 'Stats',        color: 'text-amber-700',       icon: Zap      },
  get_recent_applications: { label: 'Applications', color: 'text-orange-700',      icon: Database },
  list_blueprints:         { label: 'Blueprints',   color: 'text-purple-700',      icon: Database },
  design_page_template:    { label: 'Page Template',color: 'text-indigo-700',      icon: Sparkles },
  run_safe_command:        { label: 'Shell',        color: 'text-slate-700',       icon: Terminal },
};

function ToolCallBlock({ tc }: { tc: { tool: string; args: Record<string, unknown>; result: string } }) {
  const [open, setOpen] = useState(false);
  const meta = TOOL_META[tc.tool] ?? { label: tc.tool, color: 'text-slate-600', icon: Database };
  const Icon = meta.icon;
  let formatted = tc.result;
  try { formatted = JSON.stringify(JSON.parse(tc.result), null, 2); } catch { /* not JSON */ }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 text-xs overflow-hidden mb-2">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 transition-colors">
        {open
          ? <ChevronDown className={`w-3.5 h-3.5 ${meta.color}`} />
          : <ChevronRight className={`w-3.5 h-3.5 ${meta.color}`} />}
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        <span className={`font-semibold ${meta.color}`}>Used tool: {meta.label}</span>
        <span className="ml-auto text-slate-400 text-[10px] truncate max-w-[160px]">
          {Object.keys(tc.args).length > 0 ? JSON.stringify(tc.args).slice(0, 60) : ''}
        </span>
      </button>
      {open && (
        <pre className="px-3 pb-3 overflow-x-auto max-h-64 text-[11px] text-slate-700 bg-white border-t border-slate-200 leading-relaxed">
          {formatted}
        </pre>
      )}
    </div>
  );
}

export default function AIChat({ fileContext, onApplyCode }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [documentsContext, setDocumentsContext] = useState('');
  const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'unconfigured'>('checking');
  const [aiProvider, setAiProvider] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function checkAi() {
      try {
        const res = await fetch('/api/devstudio/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
        });
        const data = await res.json();
        if (res.status === 503 || data?.debug) { setAiStatus('unconfigured'); }
        else { setAiStatus('ready'); if (data?.provider) setAiProvider(data.provider); }
      } catch { setAiStatus('unconfigured'); }
    }
    checkAi();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDocs() {
      try {
        const res = await fetch('/api/devstudio/upload');
        if (!res.ok) return;
        const data = await res.json();
        const docs = (data.documents ?? []) as Array<{ name?: string; original_name?: string; content_type?: string; size_bytes?: number; created_at?: string }>;
        if (!docs.length) { if (!cancelled) setDocumentsContext(''); return; }
        const summary = docs.slice(0, 12).map((d, i) => {
          const date = d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : 'unknown';
          const size = typeof d.size_bytes === 'number' ? `${Math.round(d.size_bytes / 1024)}KB` : '?';
          return `${i + 1}. ${d.name || d.original_name || 'unnamed'} (${d.content_type || '?'}, ${size}, ${date})`;
        }).join('\n');
        if (!cancelled) setDocumentsContext(`Uploaded Dev Studio documents:\n${summary}`);
      } catch { if (!cancelled) setDocumentsContext(''); }
    }
    loadDocs();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const res = await fetch('/api/devstudio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          fileContext,
          documentsContext,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message, toolCalls: data.toolCalls ?? [] }]);
        if (data.provider && aiStatus !== 'ready') { setAiStatus('ready'); setAiProvider(data.provider); }
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Failed to connect: ${reason}` }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const extractCodeBlocks = (content: string) => {
    const rx = /```(\S+)?\n([\s\S]*?)```/g;
    const parts: { type: 'text' | 'code'; content: string; language?: string; filename?: string }[] = [];
    let last = 0; let m;
    while ((m = rx.exec(content)) !== null) {
      if (m.index > last) parts.push({ type: 'text', content: content.slice(last, m.index) });
      const tag = m[1] || '';
      const isFile = tag.includes('.') || tag.includes('/');
      parts.push({ type: 'code', content: m[2], language: isFile ? tag.split('.').pop() : tag, filename: isFile ? tag : undefined });
      last = m.index + m[0].length;
    }
    if (last < content.length) parts.push({ type: 'text', content: content.slice(last) });
    return parts.length ? parts : [{ type: 'text' as const, content }];
  };

  const QUICK = ['Show platform stats', 'List all programs', 'Show pending applications', 'List recent enrollments', 'List course blueprints', 'Run git status'];

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <Sparkles className="w-4 h-4 text-brand-blue-600" />
        <span className="text-sm font-semibold text-slate-800">AI Platform Controller</span>
        <div className="ml-auto flex items-center gap-1.5">
          {aiStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          {aiStatus === 'ready' && (
            <span className="flex items-center gap-1 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> {aiProvider || 'AI'} ready
            </span>
          )}
          {aiStatus === 'unconfigured' && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" /> no AI key
            </span>
          )}
        </div>
      </div>

      {/* Unconfigured banner */}
      {aiStatus === 'unconfigured' && (
        <div className="flex-shrink-0 flex items-start gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-snug">
            <strong>AI not configured.</strong> Add <code className="bg-amber-100 px-1 rounded">GROQ_API_KEY</code> to{' '}
            <code className="bg-amber-100 px-1 rounded">.env.local</code> and restart the dev server.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="py-8">
            <div className="text-center mb-6">
              <Bot className="w-12 h-12 text-brand-blue-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Ask me anything about the platform.</p>
              <p className="text-xs text-slate-400">I can query live data, explain code, generate courses, and more.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK.map((q) => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full text-xs border border-slate-200 bg-white text-slate-600 hover:border-brand-blue-400 hover:bg-brand-blue-50 hover:text-brand-blue-700 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0 && (
                <div>{msg.toolCalls.map((tc, j) => <ToolCallBlock key={j} tc={tc} />)}</div>
              )}
              <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[86%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="space-y-2">
                      {extractCodeBlocks(msg.content).map((part, j) =>
                        part.type === 'code' ? (
                          <div key={j}>
                            <div className="flex items-center justify-between px-3 py-1 bg-slate-200 rounded-t border border-slate-300 border-b-0">
                              <span className="text-[11px] text-slate-600 font-mono">{part.filename || part.language || 'code'}</span>
                              <div className="flex gap-2 items-center">
                                {part.filename && onApplyCode && (
                                  <button onClick={() => onApplyCode(part.filename!, part.content)}
                                    className="text-[11px] text-brand-blue-600 hover:underline font-medium">Apply</button>
                                )}
                                <button onClick={() => copyCode(part.content, i * 100 + j)} className="text-slate-500 hover:text-slate-700">
                                  {copiedIndex === i * 100 + j
                                    ? <Check className="w-3 h-3 text-green-600" />
                                    : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            <pre className="px-3 py-2 rounded-b border border-slate-300 border-t-0 bg-white overflow-x-auto text-[12px] text-slate-800 font-mono leading-relaxed">
                              <code>{part.content}</code>
                            </pre>
                          </div>
                        ) : (
                          <p key={j} className="whitespace-pre-wrap leading-relaxed text-slate-800">{part.content}</p>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200">
              <Loader2 className="w-4 h-4 text-brand-blue-500 animate-spin" />
              <span className="text-sm text-slate-500">thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything — code, data, course gen… (Enter to send)"
            rows={3}
            className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 resize-y min-h-[80px] max-h-[35vh] focus:border-brand-blue-500 focus:outline-none"
          />
          <div className="flex flex-col gap-1.5">
            <label
              title="Upload file"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.csv,.png,.jpg,.jpeg,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('/api/devstudio/upload', { method: 'POST', body: formData });
                    if (res.ok) {
                      setInput((prev) => prev + (prev ? '\n' : '') + `[Uploaded: ${file.name}]`);
                    }
                  } catch { /* non-fatal */ }
                  e.target.value = '';
                }}
              />
            </label>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Powered by Groq · Enter to send · Shift+Enter for newline · 📎 to upload files
        </p>
      </div>
    </div>
  );
}
