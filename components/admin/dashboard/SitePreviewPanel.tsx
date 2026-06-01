'use client';

import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import type { SitePreviewTarget } from './types';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Props {
  sites: SitePreviewTarget[];
}

type SiteStatusState = 'healthy' | 'degraded' | 'down' | null;

interface SiteStatus {
  url: string;
  state: SiteStatusState;
  latencyMs: number | null;
  httpStatus: number | null;
  checkedAt: Date | null;
}

async function checkSite(url: string): Promise<{ state: SiteStatusState; latencyMs: number; httpStatus: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`/api/admin/site-health?url=${encodeURIComponent(url)}`, { cache: 'no-store' });
    if (!res.ok) return { state: 'down', latencyMs: Date.now() - start, httpStatus: 0 };
    const data = await res.json();
    const latencyMs = data.latencyMs ?? Date.now() - start;
    if (!data.ok) return { state: 'down', latencyMs, httpStatus: data.status ?? 0 };
    if (data.degraded) return { state: 'degraded', latencyMs, httpStatus: data.status ?? 0 };
    return { state: latencyMs > 2000 ? 'degraded' : 'healthy', latencyMs, httpStatus: data.status ?? 200 };
  } catch {
    return { state: 'down', latencyMs: Date.now() - start, httpStatus: 0 };
  }
}

// Env-aware URLs — never hardcoded
const DEFAULT_SITES = [
  {
    url: process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl,
    label: 'Public Site',
  },
  {
    url: process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.${PLATFORM_DEFAULTS.canonicalDomain}',
    label: 'Admin',
  },
  {
    url: process.env.NEXT_PUBLIC_LMS_URL ?? 'https://lms.${PLATFORM_DEFAULTS.canonicalDomain}',
    label: 'LMS',
  },
];

export function SitePreviewPanel({ sites }: Props) {
  const targets = sites.length > 0 ? sites : DEFAULT_SITES;

  const [statuses, setStatuses] = useState<Record<string, SiteStatus>>(
    Object.fromEntries(targets.map((t) => [t.url, { url: t.url, state: null, latencyMs: null, httpStatus: null, checkedAt: null }])),
  );
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const results = await Promise.all(
      targets.map((t) => checkSite(t.url).then((r) => ({ url: t.url, ...r }))),
    );
    setStatuses(
      Object.fromEntries(
        results.map((r) => [r.url, { url: r.url, state: r.state, latencyMs: r.latencyMs, httpStatus: r.httpStatus, checkedAt: new Date() }]),
      ),
    );
    setChecking(false);
  };

  // Checks are lazy — only run when the admin clicks "Check status".
  // Auto-running on mount fired 3 outbound HEAD requests (6s timeout each)
  // on every dashboard load, making the panel feel slow even though it's
  // client-side. The panel renders immediately with "—" status indicators.

  const checkedAt = Object.values(statuses).find((s) => s.checkedAt)?.checkedAt;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">Site preview &amp; status</span>
        </div>
        <button
          onClick={runChecks}
          disabled={checking}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {targets.map((target) => {
          const s = statuses[target.url];
          const state = s?.state ?? null;
          return (
            <div key={target.url} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {state === null ? (
                  <Clock className="w-4 h-4 text-slate-300 flex-shrink-0 animate-pulse" />
                ) : state === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />
                ) : state === 'degraded' ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {(target as { label?: string }).label ?? target.url}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{target.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {state !== null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    state === 'healthy' ? 'bg-brand-green-50 text-brand-green-700' :
                    state === 'degraded' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {state === 'healthy' ? `${s.latencyMs}ms` :
                     state === 'degraded' ? `Degraded${s.httpStatus ? ` (${s.httpStatus})` : ''}` :
                     'Down'}
                  </span>
                )}
                <a
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()}` : 'Checking…'}
        </p>
        <Link href="/admin/monitoring" className="text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium">
          Full monitoring →
        </Link>
      </div>
    </div>
  );
}
