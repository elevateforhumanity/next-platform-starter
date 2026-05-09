'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, Check, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  fileContext?: string;
  onApplyCode?: (filename: string, code: string) => void;
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

  // Probe AI availability on mount
  useEffect(() => {
    async function checkAi() {
      try {
        const res = await fetch('/api/devstudio/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
        });
        const data = await res.json();
        if (res.status === 503 || data?.debug) {
          setAiStatus('unconfigured');
        } else {
          setAiStatus('ready');
          if (data?.provider) setAiProvider(data.provider);
        }
      } catch {
        setAiStatus('unconfigured');
      }
    }
    checkAi();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDocumentsContext() {
      try {
        const res = await fetch('/api/devstudio/upload');
        if (!res.ok) return;
        const data = await res.json();
        const docs = (data.documents ?? []) as Array<{
          name?: string;
          original_name?: string;
          content_type?: string;
          size_bytes?: number;
          created_at?: string;
        }>;

        if (!docs.length) {
          if (!cancelled) setDocumentsContext('');
          return;
        }

        const summary = docs
          .slice(0, 12)
          .map((d, i) => {
            const date = d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : 'unknown-date';
            const size = typeof d.size_bytes === 'number' ? `${Math.round(d.size_bytes / 1024)}KB` : 'unknown-size';
            return `${i + 1}. ${d.name || d.original_name || 'unnamed'} (${d.content_type || 'unknown-type'}, ${size}, ${date})`;
          })
          .join('\n');

        if (!cancelled) {
          setDocumentsContext(`Uploaded Dev Studio documents:\n${summary}`);
        }
      } catch {
        if (!cancelled) setDocumentsContext('');
      }
    }

    loadDocumentsContext();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/devstudio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          fileContext,
          documentsContext,
        }),
      });

      const data = await res.json();

      if (data.error) {
        // Surface the full error — includes actionable config instructions on 503
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed to connect to AI service: ${reason}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\S+)?\n([\s\S]*?)```/g;
    const parts: {
      type: 'text' | 'code';
      content: string;
      language?: string;
      filename?: string;
    }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }

      const langOrFile = match[1] || '';
      const isFilename = langOrFile.includes('.') || langOrFile.includes('/');

      parts.push({
        type: 'code',
        content: match[2],
        language: isFilename ? langOrFile.split('.').pop() : langOrFile,
        filename: isFilename ? langOrFile : undefined,
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  const applyCode = (filename: string, code: string) => {
    if (onApplyCode) {
      onApplyCode(filename, code);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
        <Sparkles className="w-4 h-4 text-brand-blue-600" />
        <span className="text-sm font-medium text-slate-700">AI Assistant</span>
      </div>

      {/* AI status banner */}
      {aiStatus === 'unconfigured' && (
        <div className="flex-shrink-0 flex items-start gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-snug">
            <strong>AI not configured.</strong> Add <code className="bg-amber-100 px-1 rounded">GROQ_API_KEY</code> or{' '}
            <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> to the container environment
            (Codespaces secrets or SSM <code className="bg-amber-100 px-1 rounded">/elevate/GROQ_API_KEY</code>).
          </div>
        </div>
      )}
      {aiStatus === 'ready' && (
        <div className="flex-shrink-0 flex items-center gap-2 bg-green-50 border-b border-green-200 px-4 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-600" />
          <span className="text-xs text-green-800">
            AI ready{aiProvider ? ` · ${aiProvider}` : ''}
          </span>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-2">AI Assistant ready</p>
            <p className="text-slate-400 text-xs">
              Ask me to write code, explain something, or help debug
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] ${msg.role === 'user' ? 'bg-brand-blue-600' : 'bg-slate-100 border border-slate-200'} rounded-lg p-3`}
              >
                {msg.role === 'assistant' ? (
                  <div className="space-y-2">
                    {extractCodeBlocks(msg.content).map((part, j) =>
                      part.type === 'code' ? (
                        <div key={j} className="relative">
                          <div className="flex items-center justify-between bg-slate-50 px-3 py-1 rounded-t border border-slate-200 border-b-0">
                            <span className="text-xs text-slate-500">
                              {part.filename || part.language || 'code'}
                            </span>
                            <div className="flex gap-1">
                              {part.filename && onApplyCode && (
                                <button
                                  onClick={() => applyCode(part.filename!, part.content)}
                                  className="text-xs text-brand-blue-600 hover:underline"
                                >
                                  Apply
                                </button>
                              )}
                              <button
                                onClick={() => copyCode(part.content, i * 100 + j)}
                                className="p-1 text-slate-500 hover:text-slate-700"
                              >
                                {copiedIndex === i * 100 + j ? (
                                  <Check className="w-3 h-3 text-brand-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                          <pre className="bg-white p-3 rounded-b border border-slate-200 border-t-0 overflow-x-auto">
                            <code className="text-xs text-slate-700">{part.content}</code>
                          </pre>
                        </div>
                      ) : (
                        <p key={j} className="text-sm text-slate-700 whitespace-pre-wrap">
                          {part.content}
                        </p>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-700" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer — flex-shrink-0 keeps it pinned at the bottom regardless of message count */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to help with code… (Enter to send, Shift+Enter for newline)"
            rows={4}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm resize-y min-h-[120px] max-h-[40vh] focus:border-brand-blue-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 px-2 py-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Powered by Groq · Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
