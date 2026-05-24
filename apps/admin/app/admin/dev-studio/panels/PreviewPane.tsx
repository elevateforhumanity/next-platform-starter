'use client';
import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink, Loader2, AlertTriangle, Monitor, Smartphone, Tablet, RotateCcw } from 'lucide-react';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

function useEmbedCheck(url: string) {
  const [state, setState] = useState<{ embeddable: boolean | null; reason?: string }>({ embeddable: null });
  useEffect(() => {
    if (!url) return;
    setState({ embeddable: null });
    const ctrl = new AbortController();
    fetch(`/api/devstudio/embed-check?url=${encodeURIComponent(url)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((d: { embeddable: boolean; reason?: string }) => setState(d))
      .catch(() => setState({ embeddable: true }));
    return () => ctrl.abort();
  }, [url]);
  return state;
}

function IframePreview({ url, device }: { url: string; device: DeviceType }) {
  const { embeddable, reason } = useEmbedCheck(url);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  useEffect(() => { setLoading(true); setKey(k => k + 1); }, [url]);

  if (!url) return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full" style={{ background: '#1e1e1e' }}>
      <Globe className="w-8 h-8" style={{ color: '#3c3c3c' }} />
      <p className="text-[11px]" style={{ color: '#555' }}>Enter a URL to preview</p>
    </div>
  );

  if (embeddable === null) return (
    <div className="flex items-center justify-center w-full h-full" style={{ background: '#1e1e1e' }}>
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#858585' }} />
    </div>
  );

  if (embeddable === false) return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-center px-6" style={{ background: '#1e1e1e' }}>
      <AlertTriangle className="w-8 h-8" style={{ color: '#f0a500' }} />
      <p className="text-sm font-medium" style={{ color: '#cccccc' }}>Can&apos;t embed this page</p>
      <p className="text-[11px]" style={{ color: '#858585' }}>
        Server returned <code style={{ color: '#4ec9b0' }}>{reason}</code>
      </p>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
        style={{ background: '#0078d4', color: '#fff' }}>
        <ExternalLink className="w-4 h-4" /> Open in new tab
      </a>
    </div>
  );

  // For mobile/tablet, center the constrained width inside a scrollable container.
  // For desktop, fill the full pane — no wrapper needed.
  const isConstrained = device !== 'desktop';
  const constrainedW  = device === 'mobile' ? 375 : 768;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ background: '#1e1e1e' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: '#1e1e1e' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#858585' }} />
        </div>
      )}
      {isConstrained ? (
        /* Constrained viewport: center the device frame, allow horizontal scroll */
        <div className="flex-1 overflow-auto flex justify-center" style={{ minHeight: 0 }}>
          <div style={{ width: constrainedW, flexShrink: 0, height: '100%' }}>
            <iframe key={key} src={url} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              onLoad={() => setLoading(false)} title="Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals" />
          </div>
        </div>
      ) : (
        /* Full-width desktop: iframe fills the pane exactly */
        <iframe key={key} src={url} style={{ flex: 1, width: '100%', border: 'none', minHeight: 0 }}
          onLoad={() => setLoading(false)} title="Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals" />
      )}
    </div>
  );
}

export default function PreviewPane({
  inputUrl, liveUrl, device,
  onInputChange, onGo, onRefresh, onDeviceChange,
  previewTargets,
}: {
  inputUrl: string;
  liveUrl: string;
  device: DeviceType;
  onInputChange: (v: string) => void;
  onGo: () => void;
  onRefresh: () => void;
  onDeviceChange: (d: DeviceType) => void;
  previewTargets?: { label: string; url: string }[];
}) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#1e1e1e' }}>
      {/* Address bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 border-b"
        style={{ height: 35, borderColor: '#3c3c3c', background: '#2d2d2d' }}>
        <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#858585' }} />
        <input
          value={inputUrl}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onGo(); }}
          placeholder="https://…"
          className="flex-1 bg-transparent outline-none text-[11px] px-1"
          style={{ color: '#cccccc', fontFamily: 'sans-serif', minWidth: 0 }}
        />
        {previewTargets && previewTargets.length > 0 && (
          <select
            onChange={e => { if (e.target.value) { onInputChange(e.target.value); onGo(); } }}
            className="bg-transparent text-[10px] outline-none border-none"
            style={{ color: '#858585' }}
            defaultValue="">
            <option value="" disabled>targets</option>
            {previewTargets.map(t => (
              <option key={t.url} value={t.url}>{t.label}</option>
            ))}
          </select>
        )}
        <button title="Desktop" onClick={() => onDeviceChange('desktop')}
          className="p-1 rounded" style={{ color: device === 'desktop' ? '#4ec9b0' : '#555' }}>
          <Monitor className="w-3.5 h-3.5" />
        </button>
        <button title="Tablet" onClick={() => onDeviceChange('tablet')}
          className="p-1 rounded" style={{ color: device === 'tablet' ? '#4ec9b0' : '#555' }}>
          <Tablet className="w-3.5 h-3.5" />
        </button>
        <button title="Mobile" onClick={() => onDeviceChange('mobile')}
          className="p-1 rounded" style={{ color: device === 'mobile' ? '#4ec9b0' : '#555' }}>
          <Smartphone className="w-3.5 h-3.5" />
        </button>
        <button title="Refresh" onClick={onRefresh} className="p-1 rounded" style={{ color: '#858585' }}>
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <a href={liveUrl || inputUrl} target="_blank" rel="noopener noreferrer"
          className="p-1 rounded" style={{ color: '#858585' }}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* iframe */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <IframePreview url={liveUrl} device={device} />
      </div>
    </div>
  );
}
