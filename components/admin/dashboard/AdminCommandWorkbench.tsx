'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { ColoredLivePreviewFrame, type PreviewTarget } from './ColoredLivePreviewFrame';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const AIChat = dynamic(() => import('@/components/dev-studio/AIChat'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
      Loading Ellie…
    </div>
  ),
});

const DEFAULT_TARGETS: PreviewTarget[] = [
  { label: 'Public site', url: process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl },
  {
    label: 'Admin',
    url: process.env.NEXT_PUBLIC_ADMIN_URL ?? `https://admin.${PLATFORM_DEFAULTS.canonicalDomain}`,
  },
  {
    label: 'LMS',
    url: process.env.NEXT_PUBLIC_LMS_URL ?? `https://lms.${PLATFORM_DEFAULTS.canonicalDomain}`,
  },
];

export type AdminCommandWorkbenchProps = {
  sites?: PreviewTarget[];
  defaultPreviewUrl?: string;
  className?: string;
  previewMinHeight?: number;
};

/**
 * Ellie merged into the preview container you already use:
 * workspace on top → gradient URL bar + chips → iframe at bottom.
 */
export function AdminCommandWorkbench({
  sites,
  defaultPreviewUrl,
  className = '',
  previewMinHeight = 380,
}: AdminCommandWorkbenchProps) {
  const targets = useMemo(() => {
    return (sites?.length ? sites : DEFAULT_TARGETS).map((t) => ({
      label: t.label,
      url: t.url,
    }));
  }, [sites]);

  return (
    <ColoredLivePreviewFrame
      targets={targets}
      defaultUrl={defaultPreviewUrl}
      minHeight={previewMinHeight}
      className={className}
      workspaceTop={<AIChat ellieMode />}
      workspaceMinHeight={380}
      showSiteHealth
    />
  );
}
