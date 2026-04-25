'use client';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import FileTree from '@/components/dev-studio/FileTree';
import PreviewPanel from '@/components/dev-studio/PreviewPanel';
import XTerminal, { type XTerminalHandle } from '@/components/dev-studio/XTerminal';
import {
  GitBranch,
  Play,
  Rocket,
  Save,
  Send,
} from 'lucide-react';

// Lazy load Monaco to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/dev-studio/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-500 mx-auto mb-4" />
        <div>Loading Dev Studio...</div>
      </div>
    </div>
  ),
});

export function DevStudioPageClient() {

  // GitHub state
  const [token, setToken] = useState<string>('');
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(
    'elevateforhumanity/fix2'
  );
  const [branch, setBranch] = useState<string>('main');

  // File state
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileSha, setFileSha] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showCourseFilesOnly, setShowCourseFilesOnly] = useState(false);

  // Command terminal
  const terminalRef = useRef<XTerminalHandle>(null);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<{ role: string; content: string }[]>([]);

  // Load GitHub token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('gh_token');
    if (storedToken) {
      setToken(storedToken);
      loadRepos(storedToken);
    } else {
      addTerminalOutput('⚠  No GitHub token found. Please connect GitHub first.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load repos when token changes
  useEffect(() => {
    if (token && selectedRepo) {
      loadFileTree();
    }
  }, [token, selectedRepo, branch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy terminal helper — kept for any remaining callers during transition
  const addTerminalOutput = (message: string) => {
    terminalRef.current?.write(`$ ${message}`);
  };

  const connectGitHub = () => {
    // In production, this would redirect to GitHub OAuth
    // For now, prompt for token
    const newToken = prompt('Enter your GitHub Personal Access Token:');
    if (newToken) {
      localStorage.setItem('gh_token', newToken);
      setToken(newToken);
      addTerminalOutput(
        '✓ GitHub connected successfully'
      );
      loadRepos(newToken);
    }
  };

  const loadRepos = async (ghToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/repos', {
        headers: { 'x-gh-token': ghToken },
      });

      if (res.ok) {
        const data = await res.json();
        setRepos(data);
        addTerminalOutput(
          `✓ Loaded ${data.length} repositories`
        );
      } else {
        addTerminalOutput(
          '✗ Failed to load repositories'
        );
      }
    } catch (error) { /* Error handled silently */ 
      addTerminalOutput(
        '✗ Error loading repositories'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFileTree = async () => {
    if (!token || !selectedRepo) return;

    setLoading(true);
    addTerminalOutput(`📂 Loading files from ${selectedRepo}...`);

    try {
      const url = new URL('/api/github/tree', window.location.origin);
      url.searchParams.set('repo', selectedRepo);
      url.searchParams.set('ref', branch);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        const filePaths = data.files.map((f: Record<string, any>) => f.path);
        setFiles(filePaths);
        addTerminalOutput(
          `✓ Loaded ${filePaths.length} files`
        );
      } else {
        addTerminalOutput(
          '✗ Failed to load file tree'
        );
      }
    } catch (error) { /* Error handled silently */ 
      addTerminalOutput(
        '✗ Error loading file tree'
      );
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (path: string) => {
    if (!token || !selectedRepo) return;

    setLoading(true);
    addTerminalOutput(`📄 Opening ${path}...`);

    try {
      const url = new URL('/api/github/file', window.location.origin);
      url.searchParams.set('repo', selectedRepo);
      url.searchParams.set('path', path);
      url.searchParams.set('ref', branch);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setSelectedFile(path);
        setFileContent(data.content);
        setFileSha(data.sha);
        setHasChanges(false);
        addTerminalOutput(
          `✓ Opened ${path}`
        );
      } else {
        addTerminalOutput(
          `✗ Failed to open ${path}`
        );
      }
    } catch (error) { /* Error handled silently */ 
      addTerminalOutput(
        `✗ Error opening ${path}`
      );
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!token || !selectedRepo || !selectedFile) return;

    setLoading(true);
    addTerminalOutput(`💾 Saving ${selectedFile}...`);

    try {
      const res = await fetch('/api/github/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo,
          path: selectedFile,
          content: fileContent,
          sha: fileSha,
          message: `Update ${selectedFile}`,
          branch,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setFileSha(data.content.sha);
        setHasChanges(false);
        addTerminalOutput(
          `✓ Saved ${selectedFile}`
        );
        addTerminalOutput(`   Commit: ${data.commit.substring(0, 7)}`);
      } else {
        const error = await res.json();
        addTerminalOutput(
          `✗ Failed to save`
        );
      }
    } catch (error) { /* Error handled silently */ 
      addTerminalOutput(
        '✗ Error saving file'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setFileContent(newCode);
    setHasChanges(true);
  };

  const executeCommand = async () => {
    if (!command.trim() || executing) return;
    const cmd = command.trim();
    setCommand('');
    setExecuting(true);

    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, history: cmdHistory }),
      });

      if (!res.ok || !res.body) {
        terminalRef.current?.write('\x1b[31m✗  Failed to connect to execute endpoint\x1b[0m');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const payload = part.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { line } = JSON.parse(payload);
            if (line !== undefined) terminalRef.current?.write(line);
          } catch { /* malformed chunk */ }
        }
      }

      setCmdHistory(prev => [
        ...prev,
        { role: 'user', content: cmd },
      ]);
    } catch (err) {
      terminalRef.current?.write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m`);
    } finally {
      setExecuting(false);
    }
  };

  const handleCommandKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') executeCommand();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">

      {/* Hero Image */}
      <div className="bg-slate-800 px-4 py-2">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dev Studio' }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-dev-studio-detail.jpg"
          alt="Hero"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">
            <Rocket className="w-5 h-5 inline-block" /> Elevate Dev Studio
          </h1>

          {token ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedRepo}
                onChange={(
                  e: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >
                ) => setSelectedRepo(e.target.value)}
                className="bg-slate-700 text-white px-3 py-2 rounded text-sm"
              >
                <option value="elevateforhumanity/fix2">
                  elevateforhumanity/fix2
                </option>
                {repos.map((repo) => (
                  <option key={repo.full_name} value={repo.full_name}>
                    {repo.full_name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 text-sm text-black">
                <GitBranch className="w-4 h-4" />
                <span>{branch}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={connectGitHub}
              className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 rounded text-sm"
            >
              Connect GitHub
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCourseFilesOnly}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setShowCourseFilesOnly(e.target.checked)
              }
              className="rounded"
            />
            <span>Course Files Only</span>
          </label>

          <button
            onClick={saveFile}
            disabled={!hasChanges || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              hasChanges && !loading
                ? 'bg-brand-green-600 hover:bg-brand-green-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 rounded" aria-label="Action button">
            <Play className="w-4 h-4" />
            Run
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-r border-slate-700">
          <FileTree
            files={files}
            onFileSelect={openFile}
            selectedFile={selectedFile}
            filterCourses={showCourseFilesOnly}
          />
        </div>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1">
            {selectedFile ? (
              <CodeEditor
                value={fileContent}
                onChange={handleCodeChange}
                filePath={selectedFile}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400">
                <div className="text-center">
                  <p className="text-lg mb-2">No file selected</p>
                  <p className="text-sm">
                    Select a file from the tree to start editing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Command terminal */}
          <div className="h-64 border-t border-slate-700 flex flex-col">
            <div className="flex-1 min-h-0">
              <XTerminal ref={terminalRef} />
            </div>
            {/* Command input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-t border-[#30363d]">
              <span className="text-[#3fb950] font-mono text-sm flex-shrink-0">$</span>
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleCommandKey}
                placeholder="Tell me what to do — &quot;generate a CNA course&quot;, &quot;show today's applications&quot;, &quot;run enrollment report&quot;"
                disabled={executing}
                className="flex-1 bg-transparent text-[#c9d1d9] font-mono text-sm outline-none placeholder:text-[#6e7681] disabled:opacity-50"
              />
              <button
                onClick={executeCommand}
                disabled={!command.trim() || executing}
                className="flex-shrink-0 p-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {executing
                  ? <span className="w-4 h-4 block border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-96 border-l border-slate-700">
          <PreviewPanel url={process.env.NEXT_PUBLIC_SITE_URL || ''} filePath={selectedFile} />
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">
              Content Development Studio
            </h2>
            <p className="text-base md:text-lg mb-8 text-slate-300">
              Build courses, quizzes, and learning materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/courses"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
              >
                View Courses
              </Link>
              <Link
                href="/admin/quiz-builder"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
              >
                Quiz Builder
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
