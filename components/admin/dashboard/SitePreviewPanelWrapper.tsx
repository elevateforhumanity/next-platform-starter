'use client';

import dynamic from 'next/dynamic';
import type { SitePreviewTarget } from './types';

const SitePreviewPanel = dynamic(
  () => import('./SitePreviewPanel').then(m => m.SitePreviewPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-blue-50 to-brand-orange-50 text-sm text-slate-500">
        Loading preview…
      </div>
    ),
  }
);

export default function SitePreviewPanelWrapper({ sites }: { sites: SitePreviewTarget[] }) {
  return <SitePreviewPanel sites={sites} />;
}
