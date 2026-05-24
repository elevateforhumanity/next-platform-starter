import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import AiConsoleClient from '../ai-console/AiConsoleClient';
import Link from 'next/link';
import {
  Bot, Wrench, KeyRound, Upload, FileText, Printer,
  BookOpen, Zap, Terminal, GitMerge,
  Activity, FlaskConical,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Studio | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

const TOOL_LINKS = [
  // ── Course AI ──────────────────────────────────────────────────────────────
  { label: 'Course Pipeline',       href: '/admin/courses/pipeline',      icon: FlaskConical, desc: 'Generate full courses with AI' },
  { label: 'Course Builder',        href: '/admin/course-builder',        icon: Bot,          desc: 'Blueprint & lesson editor' },
  { label: 'All Courses',           href: '/admin/courses',               icon: BookOpen,     desc: 'Course catalog' },
  // ── Platform AI ───────────────────────────────────────────────────────────
  { label: 'Copilot',               href: '/admin/copilot',               icon: GitMerge,     desc: 'AI copilot deployments' },
  { label: 'Workflows',             href: '/admin/workflows',             icon: Zap,          desc: 'Automated workflow rules' },
  { label: 'Command Center',        href: '/admin/command-center',        icon: Activity,     desc: 'Live platform observability' },
  // ── Dev tools ─────────────────────────────────────────────────────────────
  { label: 'Dev Studio',            href: '/admin/dev-studio',            icon: Wrench,       desc: 'Command center & automation' },
  { label: 'Secrets',               href: '/admin/dev-studio?tab=secrets', icon: KeyRound,    desc: 'AI provider key management' },
  { label: 'API Keys',              href: '/admin/api-keys',              icon: Terminal,     desc: 'Manage API credentials' },
  // ── Documents ─────────────────────────────────────────────────────────────
  { label: 'Documents Upload',      href: '/admin/documents/upload',      icon: Upload,       desc: 'Upload for OCR & review' },
  { label: 'Documents',             href: '/admin/documents',             icon: FileText,     desc: 'Browse all documents' },
  { label: 'Documents Print',       href: '/admin/documents/print',       icon: Printer,      desc: 'Print workflow' },
];

export default async function AiStudioPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">

      {/* ── Left sidebar: tool links ── */}
      <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Tools</p>
        <nav className="space-y-1">
          {TOOL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-white hover:shadow-sm transition-all group"
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-blue-700 leading-tight">
                    {link.label}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                    {link.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main: full AI Console with live platform state + quick actions ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <AiConsoleClient />
      </div>

    </div>
  );
}
