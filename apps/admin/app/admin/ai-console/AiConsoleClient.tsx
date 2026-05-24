'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Loader2, Trash2, Copy, Check,
  AlertTriangle, CheckCircle2, RefreshCw,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (!provider) return null;
  const colors: Record<string, string> = {
    groq:      'bg-orange-100 text-orange-700',
    openai:    'bg-green-100 text-green-700',
    anthropic: 'bg-purple-100 text-purple-700',
    gemini:    'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[provider] ?? 'bg-slate-100 text-slate-600'}`}>
      {provider}
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-brand-blue-600' : 'bg-slate-700'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot  className="w-3.5 h-3.5 text-white" />
        }
      </div>
      <div className={`group relative max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-brand-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        <button
          onClick={copy}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 right-0 text-slate-400 hover:text-slate-600"
          title="Copy"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

export default function AiConsoleClient() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [sessionId]                 = useState(() => `session-${Date.now()}`);
  const [providerStatus, setProviderStatus] = useState<{
    activeProvider: string | null;
    keys: Record<string, { set: boolean }>;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Load provider status on mount
  useEffect(() => {
    fetch('/api/admin/ai-provider-status')
      .then(r => r.json())
      .then(data => setProviderStatus(data))
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text, ts: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? '(no response)',
        ts: Date.now(),
      }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${msg}`,
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, sessionId]);

  const clearHistory = async () => {
    await fetch('/api/admin/ai-assistant', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
    setMessages([]);
    setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const noProviders = providerStatus && !providerStatus.activeProvider;

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-blue-600" />
          <span className="font-semibold text-slate-800 text-sm">Ellie — AI Operations Assistant</span>
          {!statusLoading && providerStatus && (
            <ProviderBadge provider={providerStatus.activeProvider} />
          )}
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
          title="Clear conversation history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* ── Provider warning ── */}
      {noProviders && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 shrink-0">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>
            No AI provider keys configured. Go to{' '}
            <a href="/admin/dev-studio?tab=secrets" className="underline font-medium">Dev Studio → Secrets</a>
            {' '}to add OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY.
          </span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-brand-blue-50 flex items-center justify-center">
              <Bot className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Ask Ellie anything</p>
              <p className="text-sm text-slate-400 mt-1">
                Live platform data · Student lookups · Compliance · Operations
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'How many pending applications?',
                'Who are the at-risk students?',
                'What\'s this month\'s revenue?',
                'Show active enrollments by program',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-600 hover:border-brand-blue-400 hover:text-brand-blue-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-800">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about students, enrollments, compliance, revenue…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">
          Enter to send · Shift+Enter for newline · Powered by{' '}
          {providerStatus?.activeProvider ?? 'AI'}
        </p>
      </div>

    </div>
  );
}
