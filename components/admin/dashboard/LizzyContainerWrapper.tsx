'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { SitePreviewTarget } from './types';

const LizzyContainer = dynamic(
  () => import('./LizzyContainer').then((m) => m.LizzyContainer),
  {
    ssr: false,
    loading: () => (
      <div className="mb-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading Lizzy…
      </div>
    ),
  },
);

function LizzyContainerInner({
  sites,
  defaultPreviewUrl,
  isSuperAdmin,
}: {
  sites: SitePreviewTarget[];
  defaultPreviewUrl?: string;
  isSuperAdmin: boolean;
}) {
  const targets = sites.map((s) => ({
    label: s.label ?? s.url,
    url: s.url,
  }));

  return (
    <div className="mb-8">
      <LizzyContainer
        sites={targets}
        defaultPreviewUrl={defaultPreviewUrl}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

export default function LizzyContainerWrapper({
  sites,
  defaultPreviewUrl,
  isSuperAdmin = false,
}: {
  sites: SitePreviewTarget[];
  defaultPreviewUrl?: string;
  isSuperAdmin?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="mb-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
          Loading Lizzy…
        </div>
      }
    >
      <LizzyContainerInner
        sites={sites}
        defaultPreviewUrl={defaultPreviewUrl}
        isSuperAdmin={isSuperAdmin}
      />
    </Suspense>
  );
}
