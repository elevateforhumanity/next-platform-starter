'use client';

import dynamic from 'next/dynamic';
import type { SitePreviewTarget } from './types';

const AdminCommandWorkbench = dynamic(
  () => import('./AdminCommandWorkbench').then((m) => m.AdminCommandWorkbench),
  {
    ssr: false,
    loading: () => (
      <div className="mb-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading command center…
      </div>
    ),
  },
);

export default function AdminCommandWorkbenchWrapper({
  sites,
  defaultPreviewUrl,
}: {
  sites: SitePreviewTarget[];
  defaultPreviewUrl?: string;
}) {
  const targets = sites.map((s) => ({
    label: s.label ?? s.url,
    url: s.url,
  }));

  return (
    <div className="mb-8">
      <AdminCommandWorkbench sites={targets} defaultPreviewUrl={defaultPreviewUrl} variant="light" />
    </div>
  );
}
