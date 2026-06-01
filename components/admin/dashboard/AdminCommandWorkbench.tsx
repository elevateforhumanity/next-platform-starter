'use client';

import dynamic from 'next/dynamic';
import { Bot, PanelRight } from 'lucide-react';
import { useMemo } from 'react';
import { ColoredLivePreviewFrame, type PreviewTarget } from './ColoredLivePreviewFrame';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const AIChat = dynamic(() => import('@/components/dev-studio/AIChat'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
      Loading Ellie…
    </div>
  ),
});

const DEFAULT_TARGETS: PreviewTarget[] = [
  { label: 'Public site', url: process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl },
  {
    label: 'Admin',
    url: process.env.NEXT_PUBLIC_ADMIN_URL ?? `https://admin.${PLATFORM_DEFAULTS.canonicalDomain}`,
  },
  {
    label: 'LMS',
    url: process.env.NEXT_PUBLIC_LMS_URL ?? `https://lms.${PLATFORM_DEFAULTS.canonicalDomain}`,
  },
];

export type AdminCommandWorkbenchProps = {
  sites?: PreviewTarget[];
  defaultPreviewUrl?: string;
  /** Light = dashboard; dark = Dev Studio chrome */
  variant?: 'light' | 'dark';
  className?: string;
};

/**
 * Single operational surface: full Ellie assistant + live site preview side by side.
 * Replaces split "Ellie links" panel + separate preview board.
 */
export function AdminCommandWorkbench({
  sites,
  defaultPreviewUrl,
  variant = 'light',
  className = '',
}: AdminCommandWorkbenchProps) {
  const targets = useMemo(() => {
    const list = (sites?.length ? sites : DEFAULT_TARGETS).map((t) => ({
      label: t.label,
      url: t.url,
    }));
    return list;
  }, [sites]);

  const isDark = variant === 'dark';
  const previewMinHeight = typeof window !== 'undefined' && window.innerWidth < 1024 ? 280 : 420;

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border shadow-lg ${
        isDark ? 'border-[#3c3c3c] bg-[#252526]' : 'border-slate-200 bg-white'
      } ${className}`}
      aria-label="Command center — Ellie and live preview"
    >
      <header
        className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${
          isDark ? 'border-[#3c3c3c] bg-[#2d2d2d]' : 'border-slate-100 bg-slate-50'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isDark ? 'bg-[#094771] text-[#4ec9b0]' : 'bg-slate-900 text-white'
            }`}
          >
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Command center
            </h2>
            <p className={`text-xs truncate ${isDark ? 'text-[#858585]' : 'text-slate-500'}`}>
              Ask Ellie · preview changes live
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
            isDark ? 'text-[#4ec9b0]' : 'text-brand-blue-700'
          }`}
        >
          <PanelRight className="h-3 w-3" />
          Unified
        </span>
      </header>

      <div
        className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 ${
          isDark ? 'bg-[#1e1e1e]' : 'bg-white'
        }`}
        style={{ minHeight: 'min(72vh, 720px)' }}
      >
        <div
          className={`flex min-h-[320px] min-w-0 flex-col border-b lg:min-h-0 lg:border-b-0 lg:border-r ${
            isDark ? 'border-[#3c3c3c]' : 'border-slate-200'
          }`}
        >
          <AIChat ellieMode />
        </div>
        <div className="flex min-h-[320px] min-w-0 flex-col p-2 lg:min-h-0">
          <ColoredLivePreviewFrame
            targets={targets}
            defaultUrl={defaultPreviewUrl}
            minHeight={previewMinHeight}
            className="h-full flex-1"
          />
        </div>
      </div>
    </section>
  );
}
