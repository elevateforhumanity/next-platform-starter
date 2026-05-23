'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Brain, Send, Loader2, Trash2, Plus, ChevronDown,
  Users, DollarSign, FileText, AlertTriangle, BookOpen,
  TrendingUp, Search, Zap,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SUGGESTED_PROMPTS = [
  { icon: Users,        label: 'Active enrollments',     prompt: 'How many students are actively enrolled right now and which programs are most popular?' },
  { icon: FileText,     label: 'Pending applications',   prompt: 'Show me all pending applications and who submitted them.' },
  { icon: DollarSign,   label: 'Revenue this month',     prompt: 'What is our revenue this month broken down by program?' },
  { icon: AlertTriangle,label: 'Compliance alerts',      prompt: 'What compliance alerts are open and what do I need to do?' },
  { icon: TrendingUp,   label: 'At-risk students',       prompt: 'Which students have been inactive for more than 7 days?' },
  { icon: BookOpen,     label: 'WIOA documents',         prompt: 'What WIOA documents are pending and which students need them?' },
  { icon: Search,       label: 'Find a student',         prompt: 'Find ' },
  { icon: Zap,          label: 'Grant status',           prompt: 'What grants are currently active or in progress?' },
];

function formatContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('━') || line.startsWith('─')) {
      return <hr key={i} className="border-slate-700 my-2" />;
    }
    if (line.startsWith('## ') || line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold text-white mt-3 mb-1">{line.replace(/^##\s*/, '').replace(/\*\*/g, '')}</p>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <p key={i} className="pl-3 text-slate-200 leading-relaxed">{'• ' + line.replace(/^[-•]\s*/, '')}</p>;
    }
    if (line.trim() === '') return <div key={i} className="h-1" />;
    return <p key={i} className="text-slate-200 leading-relaxed">{line}</p>;
  });
}

export default function AiConsoleClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setShowSuggestions(false);
    setMessages((prev) => [...prev, { role: 'user', content: msg, ts: Date.now() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'No response.', ts: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.', ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, sessionId]);

  const clearSession = async () => {
    await fetch('/api/admin/ai-assistant', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    setMessages([]);
    setShowSuggestions(true);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Ellie</h1>
            <p className="text-slate-400 text-xs">Elevate Operations Assistant</p>
          </div>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-green-900/50 border border-green-700 text-green-400 text-xs font-medium">
            Live
          </span>
        </div>
        <button
          onClick={clearSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && showSuggestions && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue-600/20 border border-brand-blue-600/30 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-brand-blue-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Hi, I'm Ellie</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                I know your programs, your students, your staff, and your live data.
                Ask me anything about Elevate operations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => prompt.endsWith(' ') ? setInput(prompt) : send(prompt)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-blue-600/50 hover:bg-slate-800 transition text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-brand-blue-600/20 flex items-center justify-center shrink-0 transition">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-400 transition" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-3xl mx-auto w-full`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-brand-blue-600 flex items-center justify-center shrink-0 mr-3 mt-1">
                <Brain className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm ${
                msg.role === 'user'
                  ? 'bg-brand-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant'
                ? <div className="space-y-0.5">{formatContent(msg.content)}</div>
                : <p className="leading-relaxed">{msg.content}</p>
              }
              <p className="text-xs opacity-40 mt-2 text-right">
                {new Date(msg.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start max-w-3xl mx-auto w-full">
            <div className="w-7 h-7 rounded-lg bg-brand-blue-600 flex items-center justify-center shrink-0 mr-3 mt-1">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-800 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-brand-blue-500 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about students, revenue, compliance, programs…"
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none leading-relaxed max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0"
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">
            Ellie has access to live Elevate data. Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}
