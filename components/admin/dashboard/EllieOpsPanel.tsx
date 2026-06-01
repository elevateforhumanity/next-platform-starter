'use client';

import Link from 'next/link';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Pending applications', href: '/admin/dev-studio?tab=ellie&q=pending+applications' },
  { label: 'At-risk learners', href: '/admin/dev-studio?tab=ellie&q=at-risk+learners' },
  { label: 'System health', href: '/admin/dev-studio?tab=ellie&q=platform+health' },
] as const;

/**
 * Compact Ellie entry point on the unified admin dashboard.
 * Full assistant lives in Dev Studio — this panel avoids a second "Ellie dashboard" route.
 */
export function EllieOpsPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[280px]">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-sm">Ellie — AI Operations</h2>
            <p className="text-xs text-slate-500 truncate">Approvals, enrollments, compliance</p>
          </div>
        </div>
        <Link
          href="/admin/dev-studio?tab=ellie"
          className="text-xs font-semibold text-brand-blue-600 hover:underline shrink-0 flex items-center gap-1"
        >
          Open full assistant
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-sm text-slate-600">
          Ask Ellie about live platform data. Staged actions require your approval before they run.
        </p>
        <ul className="space-y-2">
          {QUICK_PROMPTS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:border-brand-blue-300 hover:bg-brand-blue-50/50 transition"
              >
                <Sparkles className="w-4 h-4 text-brand-blue-600 shrink-0" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <Link
          href="/admin/dev-studio?tab=ellie"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-700"
        >
          <Bot className="w-4 h-4" />
          Launch Ellie in Dev Studio
        </Link>
      </div>
    </div>
  );
}
