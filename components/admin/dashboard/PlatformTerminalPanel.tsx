'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Play, Send, Terminal } from 'lucide-react';

const XTerminal = dynamic(() => import('@/components/dev-studio/XTerminal'), { ssr: false });

const LOCAL_URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1):\d+/g;

const SHELL_QUICK_CMDS = [
  { label: 'pnpm install', cmd: 'pnpm install' },
  { label: 'dev LMS :3000', cmd: 'pnpm next dev --port 3000' },
  { label: 'dev Admin :3001', cmd: 'cd apps/admin && pnpm next dev --port 3001' },
  { label: 'lint', cmd: 'pnpm lint' },
  { label: 'test', cmd: 'pnpm test' },
  { label: 'build LMS', cmd: 'pnpm next build' },
];

const PLATFORM_QUICK_CMDS = [
  { label: 'Platform QA scan', command: 'Run full platform QA scan' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'System health', command: 'Check system health' },
  { label: 'List workflows', command: 'List workflows' },
  { label: 'Deploy LMS', command: 'Deploy the LMS service' },
];

type SubTab = 'shell' | 'commands';

export function PlatformTerminalPanel({
  onPreviewUrlDetected,
}: {
  /** When the shell prints a local dev URL, push it to the live preview iframe. */
  onPreviewUrlDetected?: (url: string) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>('shell');
  const termSendRef = useRef<((cmd: string) => void) | null>(null);
  const [shellInput, setShellInput] = useState('');

  const [cmdInput, setCmdInput] = useState('');
  const [lines, setLines] = useState<{ type: 'user' | 'output' | 'error'; text: string }[]>([]);
  const [cmdLoading, setCmdLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  function sendToShell(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    if (termSendRef.current) {
      termSendRef.current(trimmed);
      return;
    }
    setSubTab('commands');
    runPlatformCommand(trimmed);
  }

  async function runPlatformCommand(command: string) {
    const trimmed = command.trim();
    if (!trimmed || cmdLoading) return;
    setCmdInput('');
    setCmdLoading(true);
    setLines((current) => [...current, { type: 'user', text: trimmed }]);

    try {
      const isSmoke = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(trimmed);
      const isQa = /qa.?scan|platform.?qa|diagnose|audit.?platform/i.test(trimmed);
      const endpoint = isSmoke
        ? '/api/devstudio/smoke-test'
        : isQa
          ? '/api/devstudio/qa-scan?scope=all'
          : '/api/devstudio/execute';

      const res = await fetch(
        endpoint,
        isSmoke || isQa
          ? undefined
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: trimmed }),
            },
      );

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          if (!chunk.startsWith('data: ')) continue;
          const raw = chunk.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          let text = raw;
          try {
            const parsed = JSON.parse(raw);
            text = parsed.text ?? parsed.line ?? parsed.output ?? raw;
          } catch {
            text = raw;
          }
          setLines((current) => [...current, { type: 'output', text }]);
        }
      }
    } catch (error) {
      setLines((current) => [
        ...current,
        { type: 'error', text: error instanceof Error ? error.message : 'Command failed' },
      ]);
    } finally {
      setCmdLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex shrink-0 items-center gap-1 border-b border-[#3c3c3c] bg-[#252526] px-2 py-1">
        {(
          [
            { id: 'shell' as const, label: 'Shell', Icon: Terminal },
            { id: 'commands' as const, label: 'Platform commands', Icon: Play },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className="inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium"
            style={{
              borderColor: subTab === id ? '#0078d4' : '#3c3c3c',
              background: subTab === id ? '#094771' : 'transparent',
              color: '#fff',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <span className="ml-auto hidden text-[10px] text-[#858585] sm:inline">
          Shell = repo + ECS · Commands = LMS, enrollments, workflows, deploy
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1 border-b border-[#3c3c3c] bg-[#2d2d2d] px-2 py-1.5">
        {(subTab === 'shell' ? SHELL_QUICK_CMDS : PLATFORM_QUICK_CMDS).map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={cmdLoading}
            onClick={() => {
              if (subTab === 'shell' && 'cmd' in item) sendToShell(item.cmd);
              else if ('command' in item) runPlatformCommand(item.command);
            }}
            className="shrink-0 rounded border border-[#555] bg-[#3c3c3c] px-2 py-0.5 text-[10px] text-[#cccccc] disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {subTab === 'shell' ? (
        <>
          <div className="min-h-0 flex-1 overflow-hidden">
            <XTerminal
              onReady={(send) => {
                termSendRef.current = send;
              }}
              onOutput={(text) => {
                if (!onPreviewUrlDetected) return;
                const matches = text.match(LOCAL_URL_RE);
                if (matches?.[0]) onPreviewUrlDetected(matches[0]);
              }}
            />
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t border-[#3c3c3c] bg-[#252526] p-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendToShell(shellInput);
              setShellInput('');
            }}
          >
            <span className="font-mono text-sm font-bold text-[#4ec9b0]">$</span>
            <input
              value={shellInput}
              onChange={(e) => setShellInput(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded border border-[#555] bg-[#3c3c3c] px-2 font-mono text-xs text-[#cccccc] outline-none"
              placeholder="Run in container shell (pnpm, git, curl…)"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!shellInput.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded bg-[#0078d4] text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
            {lines.length === 0 && (
              <p className="text-[#555]">
                Natural-language commands for the whole platform (not just this dashboard): enrollments,
                workflows, deploy, QA, schema, routes.
              </p>
            )}
            {lines.map((line, index) => (
              <div
                key={`${line.type}-${index}`}
                className="whitespace-pre-wrap break-words"
                style={{
                  color: line.type === 'user' ? '#f97316' : line.type === 'error' ? '#f87171' : '#cccccc',
                }}
              >
                {line.type === 'user' ? `$ ${line.text}` : line.text}
              </div>
            ))}
            {cmdLoading && (
              <div className="mt-2 flex items-center gap-2 text-[#f97316]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t border-[#3c3c3c] bg-[#252526] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              runPlatformCommand(cmdInput);
            }}
          >
            <span className="font-mono text-sm font-bold text-[#f97316]">›</span>
            <input
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded border border-[#555] bg-[#3c3c3c] px-3 font-mono text-sm text-[#cccccc] outline-none"
              placeholder="e.g. List failed workflow runs, audit auth on /api/enrollments"
              disabled={cmdLoading}
            />
            <button
              type="submit"
              disabled={cmdLoading || !cmdInput.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded bg-[#f97316] text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
