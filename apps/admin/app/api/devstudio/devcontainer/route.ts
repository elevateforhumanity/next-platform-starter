/**
 * /api/devstudio/devcontainer
 *
 * Read and write .devcontainer/devcontainer.json via the GitHub Contents API.
 * Works in production (ECS) where the container has no source files.
 * Admin-only.
 *
 * GET → returns { raw, parsed, sha }
 * PUT { content, sha, message? } → commits updated devcontainer.json to main
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const REPO             = 'elevateforhumanity/Elevate-lms';
const BRANCH           = 'main';
const GH_API           = 'https://api.github.com';
const DEVCONTAINER_GH  = '.devcontainer/devcontainer.json';
const MAX_CONTENT_BYTES = 64 * 1024; // 64 KB

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DEVSTUDIO_DEVCONTAINER_MODE controls how the devcontainer route resolves
 * its read/write source:
 *
 *   github-only  — always use GitHub API; fail-fast if GITHUB_TOKEN missing
 *   local-only   — always use local filesystem; fail if file not found
 *   auto         — GitHub (if token present) → local → GitHub public read-only
 *
 * Defaults to 'auto' for backward compatibility.
 */
type DevContainerMode = 'github-only' | 'local-only' | 'auto';

function resolveMode(): DevContainerMode {
  const raw = (process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto').toLowerCase();
  if (raw === 'github-only' || raw === 'local-only') return raw;
  return 'auto';
}

interface RuntimeCapabilities {
  mode: DevContainerMode;
  canRead: boolean;
  canCommit: boolean;
  hasGitHubToken: boolean;
  hasLocalFile: boolean;
}

async function getRuntimeCapabilities(): Promise<RuntimeCapabilities> {
  const mode = resolveMode();
  const hasToken = hasGitHubToken();
  let hasLocal = false;
  try {
    const p = await resolveLocalDevcontainerPath();
    await access(p);
    hasLocal = true;
  } catch { /* no local file */ }

  return {
    mode,
    canRead:     mode === 'github-only' ? hasToken : (hasToken || hasLocal || true),
    canCommit:   hasToken,
    hasGitHubToken: hasToken,
    hasLocalFile:   hasLocal,
  };
}

function stripJsonCommentsAndTrailingCommas(input: string): string {
  let out = '';
  let inString = false;
  let quote = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    if (inString) {
      out += ch;
      if (ch === '\\') {
        if (i + 1 < input.length) {
          out += input[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === quote) {
        inString = false;
        quote = '';
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i + 1 < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonc(content: string): unknown {
  return JSON.parse(stripJsonCommentsAndTrailingCommas(content));
}

function hasGitHubToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

function computeSha(content: string): string {
  return createHash('sha1').update(content, 'utf8').digest('hex');
}

async function resolveLocalDevcontainerPath(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), DEVCONTAINER_GH),
    path.resolve(process.cwd(), '..', '..', DEVCONTAINER_GH),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep scanning candidates.
    }
  }

  return candidates[0];
}

async function readLocalDevcontainer() {
  const filePath = await resolveLocalDevcontainerPath();
  const raw = await readFile(filePath, 'utf8');
  const parsed = parseJsonc(raw);
  return { raw, parsed, sha: computeSha(raw), filePath };
}

async function writeLocalDevcontainer(content: string, expectedSha: string) {
  const current = await readLocalDevcontainer();

  if (expectedSha !== current.sha) {
    return { conflict: true as const, currentSha: current.sha };
  }

  const dir = path.dirname(current.filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(current.filePath, content, 'utf8');

  return {
    conflict: false as const,
    sha: computeSha(content),
  };
}

function ghHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function readGitHubDevcontainer(authenticated: boolean) {
  const encodedPath = encodeURIComponent(DEVCONTAINER_GH).replace(/%2F/g, '/');
  const res = await fetch(
    `${GH_API}/repos/${REPO}/contents/${encodedPath}?ref=${BRANCH}`,
    {
      headers: authenticated
        ? ghHeaders()
        : {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    return { ok: false as const, status: res.status };
  }

  const data = await res.json();
  const raw = Buffer.from(data.content, 'base64').toString('utf-8');
  const parsed = parseJsonc(raw);
  return { ok: true as const, raw, parsed, sha: data.sha };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const caps = await getRuntimeCapabilities();

  try {
    // ── github-only mode ────────────────────────────────────────────────────
    if (caps.mode === 'github-only') {
      if (!caps.hasGitHubToken) {
        return safeError(
          'DEVSTUDIO_DEVCONTAINER_MODE=github-only but GITHUB_TOKEN is not set. ' +
          'Set GITHUB_TOKEN in SSM or switch mode to auto.',
          503,
        );
      }
      const gh = await readGitHubDevcontainer(true);
      if (!gh.ok) {
        if (gh.status === 404) return safeError('devcontainer.json not found in repo', 404);
        return safeError('GitHub API error', gh.status);
      }
      return NextResponse.json({
        raw: gh.raw, parsed: gh.parsed, sha: gh.sha,
        source: 'github', writable: true,
        mode: caps.mode, capabilities: caps, canCommit: caps.canCommit,
      });
    }

    // ── local-only mode ─────────────────────────────────────────────────────
    if (caps.mode === 'local-only') {
      const local = await readLocalDevcontainer();
      return NextResponse.json({
        raw: local.raw, parsed: local.parsed, sha: local.sha,
        source: 'local', writable: true,
        mode: caps.mode, capabilities: caps, canCommit: false,
      });
    }

    // ── auto mode (default) ─────────────────────────────────────────────────
    // Priority: GitHub (authenticated) → local file → GitHub (public read-only)
    if (caps.hasGitHubToken) {
      const gh = await readGitHubDevcontainer(true);
      if (!gh.ok) {
        if (gh.status === 404) return safeError('devcontainer.json not found in repo', 404);
        return safeError('GitHub API error', gh.status);
      }
      return NextResponse.json({
        raw: gh.raw, parsed: gh.parsed, sha: gh.sha,
        source: 'github', writable: true,
        mode: caps.mode, capabilities: caps, canCommit: true,
      });
    }

    try {
      const local = await readLocalDevcontainer();
      return NextResponse.json({
        raw: local.raw, parsed: local.parsed, sha: local.sha,
        source: 'local', writable: true,
        mode: caps.mode, capabilities: caps, canCommit: false,
      });
    } catch {
      const gh = await readGitHubDevcontainer(false);
      if (!gh.ok) {
        if (gh.status === 404) return safeError('devcontainer.json not found in repo', 404);
        return safeError('Devcontainer unavailable: set GITHUB_TOKEN or ensure repo is publicly readable', 503);
      }
      return NextResponse.json({
        raw: gh.raw, parsed: gh.parsed, sha: gh.sha,
        source: 'github-readonly', writable: false,
        mode: caps.mode, capabilities: caps, canCommit: false,
      });
    }
  } catch (err) {
    return safeInternalError(err, 'Failed to read devcontainer.json');
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const caps = await getRuntimeCapabilities();

  // Fail-fast: github-only mode requires a token
  if (caps.mode === 'github-only' && !caps.hasGitHubToken) {
    return safeError(
      'DEVSTUDIO_DEVCONTAINER_MODE=github-only but GITHUB_TOKEN is not set. Cannot write.',
      503,
    );
  }

  try {
    const body = await request.json();
    const { content, sha, message } = body as { content: string; sha: string; message?: string };

    if (!content || typeof content !== 'string') {
      return safeError('content is required', 400);
    }
    if (!sha) {
      return safeError('sha is required (fetch the file first to get its sha)', 400);
    }
    if (Buffer.byteLength(content, 'utf-8') > MAX_CONTENT_BYTES) {
      return safeError(`content exceeds maximum size of ${MAX_CONTENT_BYTES / 1024} KB`, 413);
    }

    // Validate JSONC before committing
    parseJsonc(content);

    if (!hasGitHubToken()) {
      if (caps.mode === 'local-only') {
        const result = await writeLocalDevcontainer(content, sha);
        if (result.conflict) return safeError('sha mismatch; reload before saving', 409);
        return NextResponse.json({ ok: true, sha: result.sha, commit: 'local write' });
      }
      // auto mode — try local, then fail with helpful message
      try {
        const result = await writeLocalDevcontainer(content, sha);
        if (result.conflict) return safeError('sha mismatch; reload before saving', 409);
        return NextResponse.json({ ok: true, sha: result.sha, commit: 'local write (GITHUB_TOKEN not configured)' });
      } catch {
        return safeError('Save requires GITHUB_TOKEN in production/ECS environments', 503);
      }
    }

    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const encodedPath = encodeURIComponent(DEVCONTAINER_GH).replace(/%2F/g, '/');

    const res = await fetch(`${GH_API}/repos/${REPO}/contents/${encodedPath}`, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify({
        message: message ?? 'chore: update devcontainer.json via Dev Studio',
        content: encoded,
        sha,
        branch: BRANCH,
      }),
    });

    if (!res.ok) {
      await res.json().catch(() => ({})); // consume body; detail logged server-side only
      return safeError('GitHub API error', res.status);
    }

    const result = await res.json();
    return NextResponse.json({
      ok: true,
      sha: result.content?.sha,
      commit: result.commit?.html_url,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return safeError('Invalid JSON in request body', 400);
    }
    return safeInternalError(err, 'Failed to write devcontainer.json');
  }
}
