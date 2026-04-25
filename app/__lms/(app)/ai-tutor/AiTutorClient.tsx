'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, FileText, Lightbulb, Loader2, GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface LessonContext {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  moduleTitle: string;
  stepType: string;
  /** First 1200 chars of lesson content — enough for the AI to answer questions */
  contentSnippet: string;
}

interface AiTutorClientProps {
  lessonContext: LessonContext | null;
}

const QUICK_PROMPTS = [
  { icon: BookOpen,   text: 'Explain this lesson',    prompt: 'Can you explain the key concepts from this lesson in simple terms?' },
  { icon: FileText,   text: 'Create study guide',     prompt: 'Create a concise study guide for this lesson.' },
  { icon: Lightbulb,  text: 'Practice questions',     prompt: 'Give me 5 practice questions to test my understanding of this lesson.' },
  { icon: Sparkles,   text: 'Summarize key points',   prompt: 'Summarize the most important points from this lesson.' },
];

const GENERIC_PROMPTS = [
  { icon: BookOpen,   text: 'Explain a concept',      prompt: 'Can you explain a concept I\'m struggling with?' },
  { icon: FileText,   text: 'Create study guide',     prompt: 'Help me create a study guide for my current course.' },
  { icon: Lightbulb,  text: 'Practice questions',     prompt: 'Give me some practice questions to test my understanding.' },
  { icon: Sparkles,   text: 'Exam prep tips',         prompt: 'What are the best strategies for preparing for my certification exam?' },
];

export default function AiTutorClient({ lessonContext }: AiTutorClientProps) {
  const welcomeContent = lessonContext
    ? `Hello! I'm your AI Tutor. I can see you're working on **${lessonContext.lessonTitle}** in **${lessonContext.courseTitle}**.\n\nI have context about this lesson and can answer specific questions, create practice questions, or help you study. What would you like to work on?`
    : "Hello! I'm your AI Tutor, here to help you succeed in your training. I can explain concepts, create study guides, generate practice questions, and help you prepare for exams.\n\nFor lesson-specific help, open the AI Tutor from within a lesson. What would you like to work on today?";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: welcomeContent },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<'chat' | 'essay' | 'study-guide'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          mode,
          // Pass lesson context so the API can inject it into the system prompt
          lessonContext: lessonContext ?? null,
        }),
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message ?? data.error ?? "I'm having trouble responding right now. Please try again.",
      }]);

      if (data.conversationId) setConversationId(data.conversationId);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your connection and try again.",
      }]);
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

  const prompts = lessonContext ? QUICK_PROMPTS : GENERIC_PROMPTS;

  const breadcrumbs = lessonContext
    ? [
        { label: 'Courses', href: '/lms/courses' },
        { label: lessonContext.courseTitle, href: `/lms/courses/${lessonContext.courseId}` },
        { label: 'AI Tutor' },
      ]
    : [{ label: 'LMS', href: '/lms/courses' }, { label: 'AI Tutor' }];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Header */}
      <div className="bg-brand-blue-700 text-white py-5">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">AI Tutor</h1>
              <p className="text-brand-blue-200 text-xs">Your 24/7 learning assistant</p>
            </div>
          </div>

          {/* Lesson context badge */}
          {lessonContext && (
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm max-w-sm">
              <p className="text-brand-blue-100 text-xs font-semibold uppercase tracking-wide mb-0.5">Current lesson</p>
              <p className="font-semibold text-white truncate">{lessonContext.lessonTitle}</p>
              <p className="text-brand-blue-200 text-xs truncate">{lessonContext.courseTitle} · {lessonContext.moduleTitle}</p>
            </div>
          )}

          {!lessonContext && (
            <Link
              href="/lms/courses"
              className="text-xs text-brand-blue-200 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Open a lesson for context
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          {([
            { id: 'chat',         label: 'Chat',        desc: 'Q&A' },
            { id: 'essay',        label: 'Essay Help',  desc: 'Writing' },
            { id: 'study-guide',  label: 'Study Guide', desc: 'Exam prep' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm transition-colors ${
                mode === m.id
                  ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-700 font-semibold'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className="hidden sm:inline text-xs opacity-60 ml-1">· {m.desc}</span>
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ height: '520px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-brand-blue-100 text-brand-blue-700'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts — shown until user sends first message */}
          {messages.length <= 1 && (
            <div className="border-t border-slate-100 px-4 py-3 bg-white flex gap-2 overflow-x-auto shrink-0">
              {prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors whitespace-nowrap disabled:opacity-50 shrink-0"
                >
                  <p.icon className="w-3.5 h-3.5" />
                  {p.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-4 bg-white shrink-0">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lessonContext
                  ? `Ask about "${lessonContext.lessonTitle}"…`
                  : 'Ask me anything about your coursework…'}
                rows={2}
                disabled={isLoading}
                className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent disabled:bg-slate-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-5 bg-brand-blue-600 text-white rounded-xl hover:bg-brand-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-brand-blue-800 mb-2 uppercase tracking-wide">Tips for better results</p>
          <ul className="text-xs text-brand-blue-700 space-y-1">
            {lessonContext ? (
              <>
                <li>• Ask about specific terms or concepts from this lesson</li>
                <li>• Request practice questions at a specific difficulty level</li>
                <li>• Ask it to explain something a different way if the first answer isn't clear</li>
                <li>• Use Study Guide mode to generate exam prep materials for this lesson</li>
              </>
            ) : (
              <>
                <li>• Open a lesson first — the tutor will have full context about what you're studying</li>
                <li>• Be specific: "Explain refrigerant recovery" beats "explain HVAC"</li>
                <li>• Use Study Guide mode to generate exam prep materials</li>
                <li>• Ask follow-up questions to go deeper on any topic</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
