'use client';

import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import type { SitePreviewTarget } from '@/lib/admin/get-admin-dashboard-data';

interface Props {
  sites: SitePreviewTarget[];
}

interface SiteStatus {
  url: string;
  ok: boolean | null;
  latencyMs: number | null;
  checkedAt: Date | null;
}

async function checkSite(url: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`/api/admin/site-health?url=${encodeURIComponent(url)}`, { cache: 'no-store' });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export function SitePreviewPanel({ sites }: Props) {
  const targets = sites.length > 0
    ? sites
    : [
        { url: 'https://www.elevateforhumanity.org', label: 'Public Site' },
        { url: 'https://admin.elevateforhumanity.org', label: 'Admin' },
      ];

  const [statuses, setStatuses] = useState<Record<string, SiteStatus>>(
    Object.fromEntries(targets.map((t) => [t.url, { url: t.url, ok: null, latencyMs: null, checkedAt: null }])),
  );
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const results = await Promise.all(
      targets.map((t) => checkSite(t.url).then((r) => ({ url: t.url, ...r }))),
    );
    setStatuses(
      Object.fromEntries(
        results.map((r) => [r.url, { url: r.url, ok: r.ok, latencyMs: r.latencyMs, checkedAt: new Date() }]),
      ),
    );
    setChecking(false);
  };

  useEffect(() => { runChecks(); }, []);

  const checkedAt = Object.values(statuses).find((s) => s.checkedAt)?.checkedAt;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">Site Status</span>
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
          return (
            <div key={target.url} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {s.ok === null ? (
                  <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                ) : s.ok ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {(target as any).label ?? target.url}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{target.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {s.ok !== null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {s.ok ? `${s.latencyMs}ms` : 'Down'}
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
