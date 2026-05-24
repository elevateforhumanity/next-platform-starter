'use client';
import React, { MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import { Terminal, MessageSquare, Sparkles, Bot, PanelBottomClose, Play } from 'lucide-react';
import { useState } from 'react';

const XTerminal      = dynamic(() => import('@/components/dev-studio/XTerminal'),                                    { ssr: false });
const AIChat         = dynamic(() => import('@/components/dev-studio/AIChat'),                                       { ssr: false });
const AiConsoleClient = dynamic(() => import('../../ai-console/AiConsoleClient'),                                    { ssr: false });

export type BottomTab = 'terminal' | 'chat' | 'ellie' | 'command';

const QUICK_CMDS = [
  { label: 'pnpm install',  cmd: 'pnpm install' },
  { label: 'dev LMS',       cmd: 'pnpm next dev --port 3000' },
  { label: 'dev Admin',     cmd: 'cd apps/admin && pnpm next dev --port 3001' },
  { label: 'build',         cmd: 'pnpm next build' },
  { label: 'lint',          cmd: 'pnpm lint' },
];

function CommandPanel({ onSend }: { onSend: (cmd: string) => void }) {
  const [input, setInput] = useState('');
  return (
    <div className="flex flex-col h-full" style={{ background: '#1e1e1e' }}>
      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b" style={{ borderColor: '#3c3c3c' }}>
        {QUICK_CMDS.map(({ label, cmd }) => (
          <button key={label} onClick={() => onSend(cmd)}
            className="px-2 py-1 rounded text-[11px] border transition-colors"
            style={{ background: '#2d2d2d', color: '#cccccc', borderColor: '#3c3c3c' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#094771')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2d2d2d')}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <span style={{ color: '#4ec9b0', fontSize: 12 }}>$</span>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onSend(input.trim()); setInput(''); } }}
          placeholder="Run a command…"
          className="flex-1 bg-transparent outline-none text-[12px]"
          style={{ color: '#cccccc', fontFamily: 'monospace' }} />
        <button onClick={() => { if (input.trim()) { onSend(input.trim()); setInput(''); } }}
          style={{ color: '#858585' }}>
          <Play className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Detect localhost URLs in terminal output (e.g. "Local: http://localhost:3000")
const LOCAL_URL_RE = /https?:\/\/localhost:\d+/g;

export default function BottomPane({
  activeTab, onTabChange, onClose, onSendToTerminal, termCmdRef, openFile, fileContent, onDetectedUrl,
}: {
  activeTab: BottomTab;
  onTabChange: (t: BottomTab) => void;
  onClose: () => void;
  onSendToTerminal: (cmd: string) => void;
  termCmdRef: MutableRefObject<((cmd: string) => void) | null>;
  openFile: string | null;
  fileContent: string;
  onDetectedUrl?: (url: string) => void;
}) {
  const TABS: { id: BottomTab; Icon: React.ElementType<{ className?: string }>; label: string }[] = [
    { id: 'terminal', Icon: Terminal,      label: 'Terminal'  },
    { id: 'ellie',    Icon: Bot,           label: 'Ellie'     },
    { id: 'chat',     Icon: MessageSquare, label: 'Code AI'   },
    { id: 'command',  Icon: Sparkles,      label: 'Commands'  },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#1e1e1e' }}>
      {/* Tab strip */}
      <div className="flex-shrink-0 flex items-center border-b" style={{ background: '#2d2d2d', borderColor: '#3c3c3c', minHeight: 35 }}>
        {TABS.map(({ id, Icon, label }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => onTabChange(id)}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] border-r transition-colors"
              style={{
                background: active ? '#1e1e1e' : 'transparent',
                color: active ? '#fff' : '#858585',
                borderColor: '#3c3c3c',
                borderTop: active ? '1px solid #0078d4' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
        <button onClick={onClose} className="ml-auto mr-2 p-1 rounded opacity-50 hover:opacity-100"
          style={{ color: '#cccccc' }} title="Collapse panel">
          <PanelBottomClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Split: terminal left, AI right — both always mounted, hidden when inactive */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Terminal — always mounted so PTY session persists */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ display: activeTab === 'terminal' ? 'flex' : 'none', flexDirection: 'column' }}>
          <XTerminal
            onReady={(send) => { termCmdRef.current = send; }}
            onOutput={(text) => {
              if (!onDetectedUrl) return;
              const matches = text.match(LOCAL_URL_RE);
              if (matches?.[0]) onDetectedUrl(matches[0]);
            }}
          />
        </div>

        {/* Ellie — AI Operations Assistant (platform data, compliance, enrollments) */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ display: activeTab === 'ellie' ? 'flex' : 'none', flexDirection: 'column' }}>
          <AiConsoleClient />
        </div>

        {/* Code AI — code-context chat (file content, terminal output) */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
          <AIChat
            fileContext={openFile ? `File: ${openFile}\n\`\`\`\n${fileContent.slice(0, 4000)}\n\`\`\`` : undefined}
          />
        </div>

        {/* Commands */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ display: activeTab === 'command' ? 'flex' : 'none', flexDirection: 'column' }}>
          <CommandPanel onSend={onSendToTerminal} />
        </div>
      </div>
    </div>
  );
}
