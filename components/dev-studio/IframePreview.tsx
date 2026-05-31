'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Globe, Loader2 } from 'lucide-react';

function useEmbedCheck(url: string) {
  const [state, setState] = useState<{ embeddable: boolean | null; reason?: string }>({
    embeddable: null,
  });

  useEffect(() => {
    if (!url) {
      setState({ embeddable: null });
      return;
    }
    setState({ embeddable: null });
    const controller = new AbortController();
    fetch(`/api/devstudio/embed-check?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d: { embeddable: boolean; reason?: string }) => setState(d))
      .catch(() => setState({ embeddable: true }));
    return () => controller.abort();
  }, [url]);

  return state;
}

/**
 * Dev Studio live preview — checks embed headers before loading iframe.
 * www cannot be framed from admin when production sends X-Frame-Options: DENY
 * (see next.config frame-ancestors for admin host).
 */
export default function IframePreview({
  url,
  title = 'Preview',
  className,
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const { embeddable, reason } = useEmbedCheck(url);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [url]);

  if (!url) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1e1e1e] ${className ?? ''}`}
      >
        <Globe className="h-8 w-8 text-[#3c3c3c]" />
        <p className="text-[11px] text-[#555]">Enter a URL above to preview</p>
      </div>
    );
  }

  if (embeddable === null) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${className ?? ''}`}>
        <Loader2 className="h-5 w-5 animate-spin text-[#858585]" />
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center ${className ?? ''}`}
        style={{ background: '#1e1e1e' }}
      >
        <AlertTriangle className="h-8 w-8 text-[#f0a500]" />
        <p className="text-sm font-medium text-[#cccccc]">Preview can&apos;t load in the panel</p>
        <p className="text-[11px] leading-relaxed text-[#858585]">
          The public site blocks iframe embedding (
          <code className="rounded bg-[#2d2d2d] px-1 text-[#4ec9b0]">{reason}</code>
          ). This is expected until the LMS allows{' '}
          <code className="text-[#4ec9b0]">admin.elevateforhumanity.org</code> in{' '}
          <code className="text-[#4ec9b0]">frame-ancestors</code> — or open the page in a new tab.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded bg-[#0078d4] px-4 py-2 text-sm font-medium text-white hover:bg-[#005fa3]"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </a>
        <p className="text-[10px] text-[#555]">
          Local dev: use <code className="text-[#888]">http://localhost:3000</code> in the address bar.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      {loading && (
        <div
          className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-center border-b border-[#3c3c3c]"
          style={{ background: 'rgba(30,30,30,0.85)' }}
        >
          <Loader2 className="h-4 w-4 animate-spin text-[#858585]" />
        </div>
      )}
      <iframe
        src={url}
        className="h-full w-full border-0 bg-white"
        onLoad={() => setLoading(false)}
        title={title}
      />
    </div>
  );
}
