'use client';

import React, { useState } from 'react';
import { Globe, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock, Monitor } from 'lucide-react';
import Link from 'next/link';
import type { SitePreviewTarget } from './types';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ColoredLivePreviewFrame } from './ColoredLivePreviewFrame';

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

const DEFAULT_SITES: SitePreviewTarget[] = [
  {
    url: process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl,
    label: 'Public Site',
  },
  {
    url: process.env.NEXT_PUBLIC_ADMIN_URL ?? `https://admin.${PLATFORM_DEFAULTS.canonicalDomain}`,
    label: 'Admin',
  },
  {
    url: process.env.NEXT_PUBLIC_LMS_URL ?? `https://lms.${PLATFORM_DEFAULTS.canonicalDomain}`,
    label: 'LMS',
  },
];

export function SitePreviewPanel({ sites }: Props) {
  const targets = sites.length > 0 ? sites : DEFAULT_SITES;
  const previewTargets = targets.map((t) => ({
    label: (t as { label?: string }).label ?? t.url,
    url: t.url,
  }));

  const [tab, setTab] = useState<'preview' | 'status'>('preview');
  const [statuses, setStatuses] = useState<Record<string, SiteStatus>>(
    Object.fromEntries(
      targets.map((t) => [t.url, { url: t.url, state: null, latencyMs: null, httpStatus: null, checkedAt: null }]),
    ),
  );
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const results = await Promise.all(
      targets.map((t) => checkSite(t.url).then((r) => ({ url: t.url, ...r }))),
    );
    setStatuses(
      Object.fromEntries(
        results.map((r) => [
          r.url,
          { url: r.url, state: r.state, latencyMs: r.latencyMs, httpStatus: r.httpStatus, checkedAt: new Date() },
        ]),
      ),
    );
    setChecking(false);
  };

  const checkedAt = Object.values(statuses).find((s) => s.checkedAt)?.checkedAt;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white to-brand-blue-50/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue-600 to-brand-red-500 text-white shadow-sm">
            <Monitor className="h-4 w-4" />
          </span>
          <div>
            <span className="text-sm font-semibold text-slate-900">Site preview</span>
            <p className="text-[11px] text-slate-500">Live pages + uptime checks</p>
          </div>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`rounded-md px-3 py-1.5 transition ${tab === 'preview' ? 'bg-white text-brand-blue-700 shadow-sm' : 'text-slate-600'}`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setTab('status')}
            className={`rounded-md px-3 py-1.5 transition ${tab === 'status' ? 'bg-white text-brand-blue-700 shadow-sm' : 'text-slate-600'}`}
          >
            Status
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <div className="p-4">
          <ColoredLivePreviewFrame targets={previewTargets} minHeight={340} className="border-0 shadow-none" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-blue-600" />
              <span className="text-xs font-medium text-slate-600">Endpoint health</span>
            </div>
            <button
              type="button"
              onClick={runChecks}
              disabled={checking}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking…' : 'Check status'}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {targets.map((target) => {
              const s = statuses[target.url];
              const state = s?.state ?? null;
              const label = (target as { label?: string }).label ?? target.url;
              return (
                <div key={target.url} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    {state === null ? (
                      <Clock className="h-4 w-4 flex-shrink-0 animate-pulse text-slate-300" />
                    ) : state === 'healthy' ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-brand-green-500" />
                    ) : state === 'degraded' ? (
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{label}</p>
                      <p className="truncate text-xs text-slate-400">{target.url}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                    {state !== null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          state === 'healthy'
                            ? 'bg-brand-green-50 text-brand-green-700'
                            : state === 'degraded'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {state === 'healthy'
                          ? `${s.latencyMs}ms`
                          : state === 'degraded'
                            ? `Degraded${s.httpStatus ? ` (${s.httpStatus})` : ''}`
                            : 'Down'}
                      </span>
                    )}
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 transition-colors hover:text-brand-blue-600"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
            <p className="text-xs text-slate-400">
              {checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()}` : 'Click Check status to probe endpoints'}
            </p>
            <Link href="/admin/monitoring" className="text-xs font-medium text-brand-blue-600 hover:text-brand-blue-800">
              Full monitoring →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
