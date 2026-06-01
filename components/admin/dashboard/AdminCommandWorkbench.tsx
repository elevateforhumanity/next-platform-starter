'use client';

import { useMemo } from 'react';
import { ColoredLivePreviewFrame, type PreviewTarget } from './ColoredLivePreviewFrame';
import { CommandCenterWorkspace } from './CommandCenterWorkspace';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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
  isSuperAdmin?: boolean;
};

/**
 * Single admin command container: Dev Studio tools on top, live site preview below.
 */
export function AdminCommandWorkbench({
  sites,
  defaultPreviewUrl,
  className = '',
  previewMinHeight = 380,
  isSuperAdmin = false,
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
      workspaceTop={<CommandCenterWorkspace isSuperAdmin={isSuperAdmin} />}
      workspaceMinHeight={440}
      showSiteHealth
    />
  );
}
