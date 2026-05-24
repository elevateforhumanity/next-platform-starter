'use client';
import React from 'react';
import { Circle } from 'lucide-react';

interface DevStudioHealth {
  hasGroq: boolean; hasGemini: boolean; hasOpenAI: boolean;
  hasAnthropic: boolean; hasGitHub: boolean;
}

export default function StatusBar({
  studioHealth, hasAnyAI, openFile, fileDirty,
}: {
  studioHealth: DevStudioHealth | null;
  hasAnyAI: boolean;
  openFile: string | null;
  fileDirty: boolean;
}) {
  const aiProviders = studioHealth ? [
    studioHealth.hasGroq && 'Groq',
    studioHealth.hasGemini && 'Gemini',
    studioHealth.hasOpenAI && 'OpenAI',
    studioHealth.hasAnthropic && 'Anthropic',
  ].filter(Boolean).join(' · ') : '';

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-3 border-t text-[11px] select-none"
      style={{ height: 22, background: '#007acc', borderColor: '#005fa3', color: '#fff' }}>
      <span className="flex items-center gap-1">
        <Circle className="w-2 h-2 fill-current" /> main
      </span>
      {openFile && (
        <span className="truncate max-w-[300px]" style={{ color: fileDirty ? '#ffd700' : '#fff' }}>
          {openFile}{fileDirty ? ' ●' : ''}
        </span>
      )}
      <div className="ml-auto flex items-center gap-3">
        {studioHealth && (
          <>
            <span style={{ color: studioHealth.hasGitHub ? '#9cdcfe' : '#fca5a5' }}>
              {studioHealth.hasGitHub ? 'GitHub ✓' : 'GitHub ✗'}
            </span>
            <span style={{ color: hasAnyAI ? '#9cdcfe' : '#ffd700' }}>
              {hasAnyAI ? `AI: ${aiProviders}` : 'No AI key'}
            </span>
          </>
        )}
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Elevate LMS</span>
      </div>
    </div>
  );
}
