'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Globe, RefreshCw } from 'lucide-react';

export interface PreviewTarget {
  label: string;
  url: string;
}

const CHIP_THEMES = [
  'bg-brand-blue-100 text-brand-blue-800 ring-brand-blue-200 hover:bg-brand-blue-200',
  'bg-brand-red-100 text-brand-red-800 ring-brand-red-200 hover:bg-brand-red-200',
  'bg-brand-orange-100 text-brand-orange-900 ring-brand-orange-200 hover:bg-brand-orange-200',
  'bg-brand-green-100 text-brand-green-800 ring-brand-green-200 hover:bg-brand-green-200',
  'bg-violet-100 text-violet-800 ring-violet-200 hover:bg-violet-200',
  'bg-cyan-100 text-cyan-900 ring-cyan-200 hover:bg-cyan-200',
] as const;

function themeForIndex(i: number) {
  return CHIP_THEMES[i % CHIP_THEMES.length];
}

interface Props {
  targets: PreviewTarget[];
  defaultUrl?: string;
  className?: string;
  minHeight?: number;
  showChips?: boolean;
}

export function ColoredLivePreviewFrame({
  targets,
  defaultUrl,
  className = '',
  minHeight = 320,
  showChips = true,
}: Props) {
  const list = useMemo(() => (targets.length > 0 ? targets : []), [targets]);
  const initial = defaultUrl ?? list[0]?.url ?? '';
  const [url, setUrl] = useState(initial);
  const [liveUrl, setLiveUrl] = useState(initial);
  const [activeChip, setActiveChip] = useState(0);

  useEffect(() => {
    const next = defaultUrl ?? list[0]?.url ?? '';
    if (next) {
      setUrl(next);
      setLiveUrl(next);
      const idx = list.findIndex((t) => t.url === next);
      if (idx >= 0) setActiveChip(idx);
    }
  }, [defaultUrl, list]);

  const refresh = useCallback(() => {
    setLiveUrl(url);
  }, [url]);

  const selectTarget = (target: PreviewTarget, index: number) => {
    setActiveChip(index);
    setUrl(target.url);
    setLiveUrl(target.url);
  };

  if (!list.length && !url) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-brand-blue-50/40 text-sm text-slate-500 ${className}`}
        style={{ minHeight }}
      >
        No preview URL configured
      </div>
    );
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-md ${className}`}>
      {/* Browser chrome — brand gradient */}
      <div className="shrink-0 bg-gradient-to-r from-brand-blue-700 via-brand-blue-600 to-brand-red-600 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-sm" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-sm" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm" aria-hidden />
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-white/80">Live preview</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <form
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-white/95 px-2 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              refresh();
            }}
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-brand-blue-600" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none"
              spellCheck={false}
            />
          </form>
          <a
            href={liveUrl || url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {showChips && list.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-2 py-2">
          {list.map((target, i) => (
            <button
              key={target.url}
              type="button"
              onClick={() => selectTarget(target, i)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 transition ${
                activeChip === i ? themeForIndex(i) : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {target.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative min-h-0 flex-1 bg-gradient-to-b from-brand-blue-50/30 via-white to-brand-orange-50/20 p-2"
        style={{ minHeight }}
      >
        <div className="h-full overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-inner ring-1 ring-slate-100">
          {liveUrl || url ? (
            <iframe title="Live site preview" src={liveUrl || url} className="h-full w-full border-0" style={{ minHeight: minHeight - 16 }} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">Enter a URL above</div>
          )}
        </div>
      </div>
    </div>
  );
}
