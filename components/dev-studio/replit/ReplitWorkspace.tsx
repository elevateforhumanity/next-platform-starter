'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Folder, File, Terminal, Eye, Play, Save, RefreshCw, 
  ChevronRight, ChevronDown, Wifi, WifiOff, ExternalLink,
  Maximize2, Minimize2, Plus, X, Command
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
}

interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  modified: boolean;
}

interface PreviewTarget {
  label: string;
  url: string;
}

export default function ReplitWorkspace() {
  const [files] = useState<FileNode[]>([
    { name: 'apps', type: 'folder', path: '/apps', children: [
      { name: 'admin', type: 'folder', path: '/apps/admin', children: [
        { name: 'page.tsx', type: 'file', path: '/apps/admin/page.tsx', content: 'export default function Page() {\n  return (\n    <div className="p-8">\n      <h1>Hello from Dev Studio!</h1>\n    </div>\n  );\n}' },
      ]},
    ]},
    { name: 'components', type: 'folder', path: '/components', children: [
      { name: 'Button.tsx', type: 'file', path: '/components/Button.tsx', content: 'export function Button({ children }) {\n  return <button className="btn-primary">{children}</button>;\n}' },
    ]},
    { name: 'package.json', type: 'file', path: '/package.json', content: '{\n  "name": "elevate-lms",\n  "version": "1.0.0"\n}' },
  ]);
  
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', path: '/apps/admin/page.tsx', name: 'page.tsx', content: 'export default function Page() {\n  return (\n    <div className="p-8">\n      <h1>Hello from Dev Studio!</h1>\n    </div>\n  );\n}', modified: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [previewTargets] = useState<PreviewTarget[]>([
    { label: 'Admin', url: 'https://admin.elevateforhumanity.org' },
    { label: 'LMS', url: 'https://lms.elevateforhumanity.org' },
    { label: 'Main', url: 'https://elevateforhumanity.org' },
  ]);
  const [activePreview, setActivePreview] = useState<string>('https://admin.elevateforhumanity.org');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [previewFullscreen, setPreviewFullscreen] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/apps', '/apps/admin', '/components']));
  const [containerStatus, setContainerStatus] = useState<'connected' | 'disconnected' | 'starting'>('disconnected');
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '🚀 Dev Studio Ready',
    '📦 Container: Click "Connect" to start',
    '💡 Tip: Use the Command Center for quick actions',
  ]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openFile = (file: FileNode) => {
    if (file.type !== 'file') return;
    const existing = tabs.find(t => t.path === file.path);
    if (existing) { setActiveTabId(existing.id); return; }
    const newTab: Tab = {
      id: Date.now().toString(),
      path: file.path,
      name: file.name,
      content: file.content || '',
      modified: false,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  };

  const updateTabContent = (id: string, content: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content, modified: true } : t));
  };

  const connectContainer = async () => {
    setContainerStatus('starting');
    setTerminalLines(prev => [...prev, '', '🔄 Connecting to container...']);
    try {
      const res = await fetch('/api/devstudio/health');
      const data = await res.json();
      if (data.shell?.STUDIO_SHELL_WS_URL) {
        setContainerStatus('connected');
        setTerminalLines(prev => [...prev, '✅ Container connected!', `📍 Shell: ${data.shell.STUDIO_SHELL_WS_URL}`]);
      } else {
        setContainerStatus('disconnected');
        setTerminalLines(prev => [...prev, '⚠️ Container not configured', '💡 Go to Secrets panel to set up shell variables']);
      }
    } catch {
      setContainerStatus('disconnected');
      setTerminalLines(prev => [...prev, '❌ Connection failed']);
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setTerminalLines(prev => [...prev, `$ ${cmd}`]);
    setTerminalInput('');
    setIsExecuting(true);
    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (data.output) {
        setTerminalLines(prev => [...prev, ...data.output.split('\n')]);
      } else if (data.error) {
        setTerminalLines(prev => [...prev, `Error: ${data.error}`]);
      } else {
        setTerminalLines(prev => [...prev, 'Command executed']);
      }
    } catch {
      setTerminalLines(prev => [...prev, '❌ Execution failed']);
    }
    setIsExecuting(false);
  };

  const saveFile = () => {
    if (!activeTab) return;
    setTerminalLines(prev => [...prev, `💾 Saved: ${activeTab.path}`]);
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, modified: false } : t));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg">Dev Studio IDE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              containerStatus === 'connected' ? 'bg-green-500' : 
              containerStatus === 'starting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-xs text-slate-400">
              {containerStatus === 'connected' ? 'Connected' : 
               containerStatus === 'starting' ? 'Connecting...' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={connectContainer} disabled={containerStatus === 'starting'}
            className="px-3 py-1.5 rounded text-sm bg-slate-700 hover:bg-slate-600 flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            {containerStatus === 'connected' ? 'Reconnect' : 'Connect'}
          </button>
          <button onClick={saveFile}
            className="px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-700 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
          <button onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${showPreview ? 'bg-blue-600' : 'bg-slate-700'}`}>
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
            Files
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {files.map((item, i) => (
              <FileTreeItem key={i} item={item} depth={0} activePath={activeTab?.path}
                expanded={expandedFolders} onToggle={toggleFolder} onOpen={openFile} />
            ))}
          </div>
          <div className="p-2 border-t border-slate-700">
            <button className="w-full px-3 py-1.5 rounded text-sm bg-slate-700 hover:bg-slate-600 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New File
            </button>
          </div>
        </div>

        {/* Editor + Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex bg-slate-800 border-b border-slate-700 overflow-x-auto shrink-0">
            {tabs.map(tab => (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-slate-700 ${
                  activeTabId === tab.id ? 'bg-slate-900 border-b-2 border-blue-500' : 'hover:bg-slate-700'
                }`}>
                <File className="w-3 h-3" />
                <span>{tab.name}</span>
                {tab.modified && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
                <button onClick={(e) => closeTab(tab.id, e)} className="ml-1 hover:bg-slate-600 rounded p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Editor + Preview Split */}
          <div className="flex-1 flex overflow-hidden">
            <div className={`${showPreview && !previewFullscreen ? 'w-1/2' : 'w-full'} border-r border-slate-700 flex flex-col`}>
              <textarea
                value={activeTab?.content || ''}
                onChange={(e) => activeTab && updateTabContent(activeTab.id, e.target.value)}
                className="flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none outline-none"
                spellCheck={false}
                placeholder="// Open a file to edit..."
              />
            </div>

            {showPreview && (
              <div className={`${previewFullscreen ? 'w-full' : 'w-1/2'} flex flex-col bg-slate-950`}>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
                  <select value={activePreview} onChange={(e) => setActivePreview(e.target.value)}
                    className="bg-slate-700 text-sm px-2 py-1 rounded">
                    {previewTargets.map(t => (<option key={t.url} value={t.url}>{t.label}</option>))}
                  </select>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setActivePreview(activePreview + '?v=' + Date.now())} className="p-1.5 hover:bg-slate-700 rounded">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPreviewFullscreen(!previewFullscreen)} className="p-1.5 hover:bg-slate-700 rounded">
                      {previewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <a href={activePreview} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-700 rounded">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <iframe src={activePreview} className="flex-1 bg-white" title="Preview" />
              </div>
            )}
          </div>

          {/* Terminal */}
          <div className="h-44 bg-slate-950 border-t border-slate-700 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-medium">Terminal</span>
              </div>
              <button onClick={() => setTerminalLines([])} className="text-xs hover:bg-slate-700 px-2 py-0.5 rounded">
                Clear
              </button>
            </div>
            <div ref={terminalRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs">
              {terminalLines.map((line, i) => (
                <div key={i} className={`${
                  line.startsWith('❌') ? 'text-red-400' :
                  line.startsWith('✅') ? 'text-green-400' :
                  line.startsWith('$') ? 'text-blue-400' :
                  'text-slate-300'
                }`}>{line}</div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); executeCommand(terminalInput); }} className="flex border-t border-slate-800">
              <span className="px-2 text-green-400">$</span>
              <input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)}
                disabled={isExecuting} className="flex-1 bg-transparent outline-none text-sm font-mono disabled:opacity-50"
                placeholder="Type a command..." />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTreeItem({ item, depth, activePath, expanded, onToggle, onOpen }: { 
  item: FileNode; depth: number; activePath?: string; expanded: Set<string>;
  onToggle: (path: string) => void; onOpen: (file: FileNode) => void;
}) {
  const isExpanded = expanded.has(item.path);
  return (
    <div>
      <div className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-slate-700 ${
        activePath === item.path ? 'bg-blue-600' : ''
      }`} style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => item.type === 'folder' ? onToggle(item.path) : onOpen(item)}>
        {item.type === 'folder' ? (
          <>{isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Folder className="w-4 h-4 text-yellow-500" /></>
        ) : (
          <><div className="w-3" /><File className="w-4 h-4 text-slate-400" /></>
        )}
        <span className="text-sm truncate">{item.name}</span>
      </div>
      {item.type === 'folder' && isExpanded && item.children && (
        <div>{item.children.map((child, i) => (
          <FileTreeItem key={i} item={child} depth={depth + 1} activePath={activePath}
            expanded={expanded} onToggle={onToggle} onOpen={onOpen} />
        ))}</div>
      )}
    </div>
  );
}