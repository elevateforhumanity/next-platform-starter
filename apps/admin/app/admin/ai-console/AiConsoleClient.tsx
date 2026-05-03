'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Brain, Code2, BookOpen, BarChart3, Video, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AI_FEATURES = [
  {
    title: 'Course Generator',
    description: 'Generate full courses from a topic or blueprint',
    href: '/admin/course-builder',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-700',
    status: 'live',
  },
  {
    title: 'Dev Studio',
    description: 'Edit repo files and run shell commands in-browser',
    href: '/admin/editor',
    icon: Code2,
    color: 'bg-slate-50 text-slate-700',
    status: 'live',
  },
  {
    title: 'Copilot Deploy',
    description: 'Deploy AI features to learner and employer portals',
    href: '/admin/copilot/deploy',
    icon: Brain,
    color: 'bg-purple-50 text-purple-700',
    status: 'live',
  },
  {
    title: 'Analytics Assistant',
    description: 'AI-powered enrollment and revenue insights',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'bg-green-50 text-green-700',
    status: 'live',
  },
  {
    title: 'Video Generator',
    description: 'Generate D-ID talking-head lesson videos',
    href: '/admin/video-generator',
    icon: Video,
    color: 'bg-orange-50 text-orange-700',
    status: 'live',
  },
  {
    title: 'Media Studio',
    description: 'AI image and media enhancement',
    href: '/admin/media-studio',
    icon: Brain,
    color: 'bg-pink-50 text-pink-700',
    status: 'live',
  },
];

export default function AiConsoleClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "I'm your admin AI assistant. I have live access to your platform data — enrollments, applications, revenue, students, programs, and compliance. Ask me anything.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8),
        }),
      });

      const data = await res.json();
      const reply = data.reply ?? data.message ?? data.error ?? 'No response';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error — check that OPENAI_API_KEY is set.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="text-sm mb-4 text-slate-500">
          <Link href="/admin" className="hover:text-slate-900">
            Admin
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">AI Console</span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-900">AI Console</h1>
        <p className="text-slate-600 mt-1">
          GPT-4o connected to live platform data. All features below are wired and active.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat — takes 2/3 */}
        <div
          className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
          style={{ height: '600px' }}
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-slate-900 text-sm">Admin Assistant — GPT-4o</span>
            <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Live data
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about enrollments, revenue, students, compliance…"
              rows={2}
              className="flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature grid — 1/3 */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">
            AI Features
          </h2>
          {AI_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.title}
                href={f.href}
                className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {f.title}
                    </p>
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                      live
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>
                </div>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Model: GPT-4o-mini · Keys: active · Data: live Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
