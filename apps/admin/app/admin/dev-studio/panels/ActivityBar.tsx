'use client';
import React from 'react';
import { FolderOpen, GitBranch, Server, Box, FileText, Key, Sparkles } from 'lucide-react';

export type SideTab = 'files' | 'git' | 'services' | 'container' | 'documents' | 'secrets';

const ITEMS: { id: SideTab; Icon: React.ElementType<{ className?: string }>; label: string }[] = [
  { id: 'services',  Icon: Server,     label: 'Services'  },
  { id: 'files',     Icon: FolderOpen, label: 'Explorer'  },
  { id: 'git',       Icon: GitBranch,  label: 'Git'       },
  { id: 'container', Icon: Box,        label: 'Container' },
  { id: 'documents', Icon: FileText,   label: 'Documents' },
  { id: 'secrets',   Icon: Key,        label: 'Secrets'   },
];

export default function ActivityBar({ active, onSelect }: { active: SideTab; onSelect: (t: SideTab) => void }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center py-1 gap-0.5 border-r"
      style={{ width: 48, background: '#333333', borderColor: '#3c3c3c' }}>
      {ITEMS.map(({ id, Icon, label }) => {
        const isActive = active === id;
        return (
          <button key={id} title={label} onClick={() => onSelect(id)}
            className="relative flex items-center justify-center w-10 h-10 rounded transition-colors"
            style={{ color: isActive ? '#ffffff' : '#858585', background: isActive ? '#094771' : 'transparent' }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#3c3c3c'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
            {isActive && (
              <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r" style={{ background: '#0078d4' }} />
            )}
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
