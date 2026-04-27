'use client';

import dynamic from 'next/dynamic';

const SitePreviewPanel = dynamic(
  () => import('./SitePreviewPanel').then((m) => m.SitePreviewPanel),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white border border-slate-200 rounded-xl h-[580px] flex items-center justify-center text-slate-400 text-sm">
        Loading preview…
      </div>
    ),
  },
);

export default function SitePreviewPanelWrapper() {
  return <SitePreviewPanel />;
}
