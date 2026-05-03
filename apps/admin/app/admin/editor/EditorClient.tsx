'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Split from 'react-split';
import FileTree from '@/components/editor/FileTree';
import CodeEditor from '@/components/editor/CodeEditor';
import {
  Play,
  Square,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  FileCode2,
  Terminal as TermIcon,
  Globe,
  Bot,
  PanelLeft,
  GitBranch,
  Save,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

const XTerminal = dynamic(() => import('@/components/editor/XTerminal'), { ssr: false });

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Tab = 'terminal' | 'preview' | 'ai';
type Panel = 'files' | 'search' | 'git';

function getLanguage(p: string) {
  if (p.endsWith('.tsx') || p.endsWith('.ts')) return 'typescript';
  if (p.endsWith('.jsx') || p.endsWith('.js')) return 'javascript';
  if (p.endsWith('.json')) return 'json';
  if (p.endsWith('.md') || p.endsWith('.mdx')) return 'markdown';
  if (p.endsWith('.css') || p.endsWith('.scss')) return 'css';
  if (p.endsWith('.sql')) return 'sql';
  if (p.endsWith('.sh')) return 'shell';
  if (p.endsWith('.yaml') || p.endsWith('.yml')) return 'yaml';
  if (p.endsWith('.html')) return 'html';
  return 'plaintext';
}

function getFileIcon(name: string) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return '🔷';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '🟨';
  if (name.endsWith('.json')) return '📋';
  if (name.endsWith('.css') || name.endsWith('.scss')) return '🎨';
  if (name.endsWith('.md')) return '📝';
  if (name.endsWith('.sql')) return '🗄️';
  if (name.endsWith('.sh')) return '⚡';
  return '📄';
}

export default function EditorClient() {
  // File tree
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [sidePanel, setSidePanel] = useState<Panel>('files');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Open tabs
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [unsavedTabs, setUnsavedTabs] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Bottom panel
  const [bottomTab, setBottomTab] = useState<Tab>('terminal');
  const [previewUrl, setPreviewUrl] = useState(
    process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.elevateforhumanity.org',
  );
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // AI chat
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content:
        'I have access to your open files and can run shell commands. Ask me to explain code, fix bugs, generate components, or run commands.',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // Git status
  const [gitBranch, setGitBranch] = useState('main');
  const [gitStatus, setGitStatus] = useState('');

  // ── Load file tree ──────────────────────────────────────────────────────────
  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const res = await fetch('/api/devstudio/files');
      const data = await res.json();
      setFileTree(data.tree ?? []);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Load git branch
  useEffect(() => {
    handleCommand('git branch --show-current').then((b) => setGitBranch(b.trim() || 'main'));
  }, []);

  // ── Open file in tab ────────────────────────────────────────────────────────
  const openFile = useCallback(
    async (filePath: string) => {
      if (!openTabs.includes(filePath)) {
        setOpenTabs((prev) => [...prev, filePath]);
      }
      setActiveTab(filePath);

      if (!fileContents[filePath]) {
        try {
          const res = await fetch(`/api/devstudio/files?path=${encodeURIComponent(filePath)}`);
          const data = await res.json();
          if (data.content !== undefined) {
            setFileContents((prev) => ({ ...prev, [filePath]: data.content }));
          }
        } catch {
          /* ignore */
        }
      }
    },
    [openTabs, fileContents],
  );

  const closeTab = useCallback(
    (filePath: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (unsavedTabs.has(filePath) && !confirm('Discard unsaved changes?')) return;
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t !== filePath);
        if (activeTab === filePath) setActiveTab(next[next.length - 1] ?? '');
        return next;
      });
      setUnsavedTabs((prev) => {
        const s = new Set(prev);
        s.delete(filePath);
        return s;
      });
    },
    [activeTab, unsavedTabs],
  );

  // ── Save file ───────────────────────────────────────────────────────────────
  const saveFile = useCallback(
    async (filePath?: string) => {
      const path = filePath ?? activeTab;
      if (!path || saving) return;
      setSaving(true);
      try {
        const res = await fetch('/api/devstudio/files', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, content: fileContents[path] ?? '' }),
        });
        if (res.ok) {
          setUnsavedTabs((prev) => {
            const s = new Set(prev);
            s.delete(path);
            return s;
          });
          setSaveStatus(`Saved`);
          setTimeout(() => setSaveStatus(''), 2000);
          // Reload preview on save
          setPreviewKey((k) => k + 1);
        }
      } finally {
        setSaving(false);
      }
    },
    [activeTab, fileContents, saving],
  );

  // Cmd+S / Ctrl+S
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [saveFile]);

  // ── Shell execution ─────────────────────────────────────────────────────────
  const handleCommand = useCallback(async (command: string): Promise<string> => {
    return new Promise((resolve) => {
      let output = '';
      fetch('/api/devstudio/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })
        .then(async (res) => {
          if (!res.ok || !res.body) {
            resolve(`Error: ${res.status}`);
            return;
          }
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev.type === 'stdout' || ev.type === 'stderr') output += ev.text;
                else if (ev.type === 'exit') output += output.endsWith('\n') ? '' : '\n';
                else if (ev.type === 'error') output += `Error: ${ev.text}`;
              } catch {
                /* skip */
              }
            }
          }
          resolve(output || '(no output)');
        })
        .catch((e) => resolve(`Error: ${e.message}`));
    });
  }, []);

  // ── AI chat ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const sendAi = useCallback(async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiMessages((prev) => [...prev, { role: 'user', content: text }]);
    setAiInput('');
    setAiLoading(true);

    // Include current file context
    const fileContext = activeTab
      ? `\n\nCurrent file: ${activeTab}\n\`\`\`\n${(fileContents[activeTab] ?? '').slice(0, 3000)}\n\`\`\``
      : '';

    try {
      const res = await fetch('/api/devstudio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text + fileContext,
          history: aiMessages.slice(-6),
        }),
      });
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply ?? data.message ?? data.error ?? 'No response',
        },
      ]);
    } catch {
      setAiMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error.' }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiMessages, activeTab, fileContents]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen flex flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      {/* ── Top bar ── */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] flex items-center px-3 gap-3 shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
            <FileCode2 className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-[#e6edf3]">Dev Studio</span>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3]"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* File tabs */}
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {openTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-t cursor-pointer whitespace-nowrap group transition-colors ${
                activeTab === tab
                  ? 'bg-[#0d1117] text-[#e6edf3] border-t border-x border-[#30363d]'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
              }`}
            >
              <span>{getFileIcon(tab.split('/').pop() ?? '')}</span>
              <span>{tab.split('/').pop()}</span>
              {unsavedTabs.has(tab) && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
              <button
                onClick={(e) => closeTab(tab, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {saveStatus && <span className="text-xs text-green-400">{saveStatus}</span>}
          <button
            onClick={() => saveFile()}
            disabled={!unsavedTabs.has(activeTab) || saving}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] text-white text-xs rounded font-medium transition-colors"
          >
            <Save className="w-3 h-3" />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => {
              setPreviewKey((k) => k + 1);
              setBottomTab('preview');
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs rounded font-medium transition-colors"
          >
            <Play className="w-3 h-3" />
            Run
          </button>
          {/* Git branch */}
          <div className="flex items-center gap-1 text-xs text-[#8b949e] border border-[#30363d] rounded px-2 py-1">
            <GitBranch className="w-3 h-3" />
            {gitBranch}
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* ── Activity bar ── */}
        <div className="w-10 bg-[#161b22] border-r border-[#30363d] flex flex-col items-center py-2 gap-1 shrink-0">
          {[
            { id: 'files', icon: FileCode2, label: 'Files' },
            { id: 'git', icon: GitBranch, label: 'Git' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setSidePanel(id as Panel);
                setSidebarOpen(true);
              }}
              title={label}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                sidePanel === id && sidebarOpen
                  ? 'bg-[#21262d] text-[#e6edf3]'
                  : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div className="w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d] flex items-center justify-between">
              {sidePanel === 'files' ? 'Explorer' : 'Source Control'}
              <button onClick={loadTree} className="hover:text-[#e6edf3]">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {sidePanel === 'files' &&
                (treeLoading ? (
                  <div className="p-3 text-xs text-[#8b949e]">Loading…</div>
                ) : (
                  <FileTree files={fileTree} onFileSelect={openFile} selectedFile={activeTab} />
                ))}
              {sidePanel === 'git' && (
                <div className="p-3 text-xs text-[#8b949e] space-y-2">
                  <div className="flex items-center gap-1 text-[#e6edf3]">
                    <GitBranch className="w-3 h-3" /> {gitBranch}
                  </div>
                  <button
                    onClick={() => handleCommand('git status --short').then(setGitStatus)}
                    className="w-full text-left px-2 py-1 bg-[#21262d] hover:bg-[#30363d] rounded text-xs"
                  >
                    git status
                  </button>
                  <button
                    onClick={() =>
                      handleCommand('git add -A && git status --short').then(setGitStatus)
                    }
                    className="w-full text-left px-2 py-1 bg-[#21262d] hover:bg-[#30363d] rounded text-xs"
                  >
                    Stage all
                  </button>
                  {gitStatus && (
                    <pre className="text-[10px] text-[#8b949e] whitespace-pre-wrap">
                      {gitStatus}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Editor + bottom panel ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Split
            className="flex flex-col flex-1 overflow-hidden"
            direction="vertical"
            sizes={[65, 35]}
            minSize={60}
            gutterSize={4}
            gutterStyle={() => ({
              backgroundColor: '#21262d',
              cursor: 'row-resize',
            })}
          >
            {/* Code editor */}
            <div className="overflow-hidden bg-[#0d1117]">
              {activeTab ? (
                <CodeEditor
                  value={fileContents[activeTab] ?? ''}
                  onChange={(v) => {
                    setFileContents((prev) => ({ ...prev, [activeTab]: v ?? '' }));
                    setUnsavedTabs((prev) => new Set(prev).add(activeTab));
                  }}
                  language={getLanguage(activeTab)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#8b949e] gap-4">
                  <FileCode2 className="w-12 h-12 opacity-20" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#e6edf3]">No file open</p>
                    <p className="text-xs mt-1">Select a file from the explorer</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom panel */}
            <div className="flex flex-col overflow-hidden bg-[#0d1117]">
              {/* Bottom tab bar */}
              <div className="h-8 bg-[#161b22] border-t border-b border-[#30363d] flex items-center px-2 gap-1 shrink-0">
                {[
                  { id: 'terminal', icon: TermIcon, label: 'Terminal' },
                  { id: 'preview', icon: Globe, label: 'Preview' },
                  { id: 'ai', icon: Bot, label: 'AI Agent' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setBottomTab(id as Tab)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                      bottomTab === id
                        ? 'bg-[#21262d] text-[#e6edf3]'
                        : 'text-[#8b949e] hover:text-[#e6edf3]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}

                {bottomTab === 'preview' && (
                  <div className="ml-auto flex items-center gap-1">
                    <input
                      value={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      className="bg-[#21262d] border border-[#30363d] rounded px-2 py-0.5 text-xs text-[#e6edf3] w-56 focus:outline-none focus:border-[#58a6ff]"
                    />
                    <button
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3]"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                {bottomTab === 'terminal' && <XTerminal onCommand={handleCommand} />}

                {bottomTab === 'preview' && (
                  <iframe
                    ref={iframeRef}
                    key={previewKey}
                    src={previewUrl}
                    className="w-full h-full border-0 bg-white"
                    title="Live Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                )}

                {bottomTab === 'ai' && (
                  <div className="h-full flex flex-col bg-[#0d1117]">
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {aiMessages.map((m, i) => (
                        <div
                          key={i}
                          className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {m.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed ${
                              m.role === 'user'
                                ? 'bg-[#1f6feb] text-white'
                                : 'bg-[#21262d] text-[#e6edf3]'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                          <div className="bg-[#21262d] rounded-xl px-3 py-2">
                            <Loader2 className="w-3 h-3 animate-spin text-[#8b949e]" />
                          </div>
                        </div>
                      )}
                      <div ref={aiBottomRef} />
                    </div>
                    <div className="border-t border-[#30363d] p-2 flex gap-2">
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendAi();
                          }
                        }}
                        placeholder="Ask about the current file, fix a bug, generate code…"
                        rows={2}
                        className="flex-1 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#e6edf3] placeholder-[#8b949e] resize-none focus:outline-none focus:border-[#58a6ff]"
                      />
                      <button
                        onClick={sendAi}
                        disabled={!aiInput.trim() || aiLoading}
                        className="bg-[#1f6feb] hover:bg-[#388bfd] disabled:bg-[#21262d] disabled:text-[#484f58] text-white rounded-lg px-3 flex items-center transition-colors"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Split>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="h-6 bg-[#1f6feb] flex items-center px-3 gap-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {gitBranch}
        </div>
        {activeTab && (
          <>
            <span className="text-blue-200">|</span>
            <span className="text-blue-100 truncate max-w-xs">{activeTab}</span>
            <span className="text-blue-200">|</span>
            <span className="text-blue-100">{getLanguage(activeTab)}</span>
          </>
        )}
        {unsavedTabs.size > 0 && (
          <>
            <span className="text-blue-200">|</span>
            <span className="text-orange-300">{unsavedTabs.size} unsaved</span>
          </>
        )}
        <span className="ml-auto text-blue-200">Elevate Dev Studio</span>
      </div>
    </div>
  );
}
