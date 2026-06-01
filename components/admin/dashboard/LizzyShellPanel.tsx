'use client';

import dynamic from 'next/dynamic';
import { Terminal } from 'lucide-react';

const XTerminal = dynamic(() => import('@/components/dev-studio/XTerminal'), { ssr: false });

/**
 * ECS / devcontainer PTY — requires STUDIO_SHELL_WS_URL + STUDIO_SHELL_SECRET on admin task.
 */
export function LizzyShellPanel({
  onPreviewUrlDetected,
}: {
  onPreviewUrlDetected?: (url: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#3c3c3c] bg-[#252526] px-3 text-[11px] text-[#cccccc]">
        <Terminal className="h-3.5 w-3.5 text-[#4ec9b0]" />
        <span className="font-semibold">Container shell</span>
        <span className="text-[#858585]">— wired via studio-shell WebSocket</span>
      </div>
      <div className="min-h-0 flex-1">
        <XTerminal
          onOutput={(text) => {
            const match = text.match(/https?:\/\/[^\s"'<>]+/);
            if (match && onPreviewUrlDetected) onPreviewUrlDetected(match[0]);
          }}
        />
      </div>
    </div>
  );
}
