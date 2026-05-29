import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Bot, Wand2, MessageSquare, FileText, Zap, Settings } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'AI Studio | Admin',
  description: 'AI tools — chat, content generation, course builder, and automation.',
};

export const revalidate = 60;

const AI_TOOLS = [
  {
    title: 'AI Chat Console',
    description: 'Multi-provider chat with GPT-4, Claude, Gemini, and Groq. Switch models mid-conversation.',
    href: '/admin/dev-studio?tab=chat',
    icon: MessageSquare,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Course Builder',
    description: 'Generate full course outlines, lessons, quizzes, and checkpoints from a program blueprint.',
    href: '/admin/course-builder',
    icon: Wand2,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Content Generator',
    description: 'Generate blog posts, program descriptions, email copy, and marketing content.',
    href: '/admin/dev-studio?tab=chat',
    icon: FileText,
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Command Center',
    description: 'Natural-language commands to manage enrollments, applications, and platform operations.',
    href: '/admin/command-center',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Dev Studio',
    description: 'AI-assisted development — code execution, file management, and devcontainer config.',
    href: '/admin/dev-studio',
    icon: Bot,
    color: 'bg-slate-50 text-slate-600',
  },
  {
    title: 'AI Settings',
    description: 'Configure provider API keys, model preferences, rate limits, and usage quotas.',
    href: '/admin/settings/ai',
    icon: Settings,
    color: 'bg-rose-50 text-rose-600',
  },
];

export default async function AIStudioPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white px-6 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'AI Studio' },
          ]}
        />
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Bot className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Studio</h1>
            <p className="text-sm text-slate-500">AI-powered tools for content, courses, and operations</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-purple-700">
                    {tool.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{tool.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
