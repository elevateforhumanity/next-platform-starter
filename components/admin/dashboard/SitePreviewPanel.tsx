'use client';

import React, { useRef, useState } from 'react';
import { Globe, RefreshCw, ExternalLink, Monitor, Smartphone, Code2 } from 'lucide-react';
import Link from 'next/link';
import type { SitePreviewTarget } from './types';

type ViewMode = 'desktop' | 'mobile';

export function SitePreviewPanel({ sites }: { sites: SitePreviewTarget[] }) {
  const resolvedSites = sites.length > 0
    ? sites
    : [{ label: 'Public Site', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org' }];
  const [activeSite, setActiveSite] = useState(resolvedSites[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = customUrl || activeSite.url;

  const refresh = () => setPreviewKey(k => k + 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-3 border-b border-slate-100 bg-slate-50">
        <Globe className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="font-semibold text-slate-900 text-sm">Live Site Preview</span>

        {/* Site switcher */}
        <div className="flex items-center gap-1 sm:ml-2 overflow-x-auto max-w-full">
          {resolvedSites.map(site => (
            <button
              key={site.label}
              onClick={() => { setActiveSite(site); setCustomUrl(''); setPreviewKey(k => k + 1); }}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                activeSite.label === site.label && !customUrl
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {site.label}
            </button>
          ))}
        </div>

        {/* URL bar */}
        <div className="order-last sm:order-none basis-full sm:basis-auto flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 min-w-0">
          <input
            value={customUrl || activeSite.url}
            onChange={e => setCustomUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && refresh()}
            className="flex-1 text-xs text-slate-700 focus:outline-none min-w-0 bg-transparent"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setViewMode(v => v === 'desktop' ? 'mobile' : 'desktop')}
            className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${viewMode === 'mobile' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
            title={viewMode === 'desktop' ? 'Switch to mobile' : 'Switch to desktop'}
          >
            {viewMode === 'desktop' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={refresh}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/admin/dev-studio"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-white text-xs rounded-lg font-medium transition-colors"
            title="Open Dev Studio"
          >
            <Code2 className="w-3 h-3" />
            Edit
          </Link>
        </div>
      </div>

      {/* Preview frame */}
      <div className={`relative bg-slate-100 flex items-center justify-center transition-all ${
        viewMode === 'mobile' ? 'py-4' : ''
      }`} style={{ height: '520px' }}>
        <div className={`h-full overflow-hidden shadow-lg transition-all ${
          viewMode === 'mobile'
            ? 'w-[min(390px,100%)] rounded-2xl border-4 border-slate-800'
            : 'w-full'
        }`}>
          <iframe
            ref={iframeRef}
            key={previewKey}
            src={currentUrl}
            className="w-full h-full border-0 bg-white"
            title="Live Site Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  );
}
