'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Split from 'react-split';
import FileTree from '@/components/editor/FileTree';
import CodeEditor from '@/components/editor/CodeEditor';
import Terminal from '@/components/editor/Terminal';

export const dynamic = 'force-dynamic';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

function getLanguage(filePath: string): string {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) return 'javascript';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) return 'markdown';
  if (filePath.endsWith('.css') || filePath.endsWith('.scss')) return 'css';
  if (filePath.endsWith('.sql')) return 'sql';
  if (filePath.endsWith('.sh')) return 'shell';
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
  return 'plaintext';
}

export default function EditorClient() {
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [status, setStatus] = useState('');

  // Load real file tree from repo
  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const res = await fetch('/api/devstudio/files');
      const data = await res.json();
      setFileTree(data.tree ?? []);
    } catch {
      setStatus('Failed to load file tree');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  // Load real file content
  const handleFileSelect = useCallback(async (filePath: string) => {
    if (unsaved && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedFile(filePath);
    setFileContent('');
    setUnsaved(false);
    setSaveError('');
    setFileLoading(true);
    try {
      const res = await fetch(`/api/devstudio/files?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (!res.ok) {
        setFileContent(`// Error: ${data.error}`);
      } else if (data.type === 'directory') {
        setFileContent('// Select a file to edit');
      } else {
        setFileContent(data.content ?? '');
      }
    } catch {
      setFileContent('// Failed to load file');
    } finally {
      setFileLoading(false);
    }
  }, [unsaved]);

  // Save real file to disk
  const handleSave = useCallback(async () => {
    if (!selectedFile || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/devstudio/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? 'Save failed');
      } else {
        setUnsaved(false);
        setStatus(`Saved ${selectedFile}`);
        setTimeout(() => setStatus(''), 3000);
      }
    } catch {
      setSaveError('Network error — save failed');
    } finally {
      setSaving(false);
    }
  }, [selectedFile, fileContent, saving]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Real shell execution via SSE stream
  const handleCommand = useCallback(async (command: string): Promise<string> => {
    return new Promise((resolve) => {
      let output = '';
      fetch('/api/devstudio/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      }).then(async (res) => {
        if (!res.ok || !res.body) {
          resolve(`Error: ${res.status} ${res.statusText}`);
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
              const event = JSON.parse(line.slice(6));
              if (event.type === 'stdout' || event.type === 'stderr') {
                output += event.text;
              } else if (event.type === 'exit') {
                output += `\n[exit ${event.code}]`;
              } else if (event.type === 'error') {
                output += `\nError: ${event.text}`;
              }
            } catch { /* skip malformed lines */ }
          }
        }
        resolve(output || '(no output)');
      }).catch((err) => resolve(`Error: ${err.message}`));
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Dev Studio</span>
          {selectedFile && (
            <span className="text-sm text-slate-400 font-mono truncate max-w-xs">{selectedFile}</span>
          )}
          {unsaved && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">Unsaved</span>
          )}
          {saveError && <span className="text-xs text-red-400">{saveError}</span>}
          {status && <span className="text-xs text-green-400">{status}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTree}
            className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-xs"
          >
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={!unsaved || saving || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm font-medium"
          >
            {saving ? 'Saving…' : 'Save (⌘S)'}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-hidden">
        <Split
          className="flex h-full"
          sizes={[18, 82]}
          minSize={140}
          gutterSize={4}
          gutterStyle={() => ({ backgroundColor: '#334155', cursor: 'col-resize' })}
        >
          {/* File tree */}
          <div className="h-full overflow-auto bg-slate-900 border-r border-slate-700">
            {treeLoading ? (
              <div className="p-4 text-slate-400 text-sm">Loading…</div>
            ) : (
              <FileTree
                files={fileTree}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            )}
          </div>

          {/* Editor + Terminal */}
          <div className="h-full overflow-hidden">
            <Split
              className="flex flex-col h-full"
              direction="vertical"
              sizes={[68, 32]}
              minSize={80}
              gutterSize={4}
              gutterStyle={() => ({ backgroundColor: '#334155', cursor: 'row-resize' })}
            >
              <div className="h-full overflow-hidden">
                {fileLoading ? (
                  <div className="h-full bg-[#1e1e1e] flex items-center justify-center text-slate-400 text-sm">
                    Loading…
                  </div>
                ) : selectedFile ? (
                  <CodeEditor
                    value={fileContent}
                    onChange={(v) => { setFileContent(v ?? ''); setUnsaved(true); }}
                    language={getLanguage(selectedFile)}
                  />
                ) : (
                  <div className="h-full bg-[#1e1e1e] flex items-center justify-center text-slate-500 text-sm">
                    Select a file from the tree to edit
                  </div>
                )}
              </div>
              <div className="h-full overflow-hidden">
                <Terminal onCommand={handleCommand} />
              </div>
            </Split>
          </div>
        </Split>
      </div>
    </div>
  );
}
