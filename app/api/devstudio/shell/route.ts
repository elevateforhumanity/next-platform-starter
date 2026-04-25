/**
 * /api/devstudio/shell
 *
 * Streams shell command output back as SSE. Admin-only.
 *
 * POST { command: string, cwd?: string }
 *
 * Response: text/event-stream
 *   data: { type: 'stdout', text: '...' }
 *   data: { type: 'stderr', text: '...' }
 *   data: { type: 'exit',   code: 0 }
 *   data: { type: 'error',  text: '...' }
 *
 * Security:
 *  - Admin role required on every request.
 *  - Blocked commands: rm -rf /, sudo, curl|wget piped to sh, env, printenv.
 *  - cwd is resolved and must stay within repo root.
 *  - 60-second hard timeout per command.
 *  - Rate-limited to strict tier (3 req / 5 min).
 */

import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ROOT = process.cwd();
const TIMEOUT_MS = 60_000;

// Commands that are never allowed regardless of context
const BLOCKED = [
  /rm\s+-rf\s+\//,
  /sudo\s/,
  /curl.+\|\s*(ba)?sh/,
  /wget.+\|\s*(ba)?sh/,
  /^\s*env\s*$/,
  /^\s*printenv\s*/,
  />\s*\/etc\//,
];

function isBlocked(cmd: string): boolean {
  return BLOCKED.some((r) => r.test(cmd));
}

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const command: string = body?.command ?? '';
  const cwdParam: string = body?.cwd ?? '';

  if (!command.trim()) {
    return new Response(sse({ type: 'error', text: 'No command provided' }), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (isBlocked(command)) {
    return new Response(sse({ type: 'error', text: 'Command not allowed' }), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  // Resolve cwd safely within repo root
  let cwd = ROOT;
  if (cwdParam) {
    const resolved = path.resolve(ROOT, cwdParam);
    if (resolved.startsWith(ROOT)) cwd = resolved;
  }

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const write = (data: object) => controller.enqueue(enc.encode(sse(data)));

      const proc = spawn('bash', ['-c', command], {
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          TERM: 'dumb',
        },
      });

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        write({ type: 'error', text: 'Command timed out after 60s' });
        controller.close();
      }, TIMEOUT_MS);

      proc.stdout.on('data', (chunk: Buffer) => {
        write({ type: 'stdout', text: chunk.toString() });
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        write({ type: 'stderr', text: chunk.toString() });
      });

      proc.on('close', (code: number | null) => {
        clearTimeout(timer);
        write({ type: 'exit', code: code ?? -1 });
        controller.close();
      });

      proc.on('error', (err: Error) => {
        clearTimeout(timer);
        write({ type: 'error', text: err.message });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
