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
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const REPO             = 'elevateforhumanity/Elevate-lms';
const BRANCH           = 'main';
const GH_API           = 'https://api.github.com';
const DEVCONTAINER_GH  = '.devcontainer/devcontainer.json';
const MAX_CONTENT_BYTES = 64 * 1024; // 64 KB

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const encodedPath = encodeURIComponent(DEVCONTAINER_GH).replace(/%2F/g, '/');
    const res = await fetch(
      `${GH_API}/repos/${REPO}/contents/${encodedPath}?ref=${BRANCH}`,
      { headers: ghHeaders() },
    );

    if (!res.ok) {
      if (res.status === 404) return safeError('devcontainer.json not found in repo', 404);
      return safeError('GitHub API error', res.status);
    }

    const data = await res.json();
    const raw = Buffer.from(data.content, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    return NextResponse.json({ raw, parsed, sha: data.sha });
  } catch (err) {
    return safeInternalError(err, 'Failed to read devcontainer.json');
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

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

    // Validate JSON before committing
    JSON.parse(content);

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
      const err = await res.json().catch(() => ({}));
      return safeError((err as { message?: string }).message ?? 'GitHub API error', res.status);
    }

    const result = await res.json();
    return NextResponse.json({
      ok: true,
      sha: result.content?.sha,
      commit: result.commit?.html_url,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return safeError('Invalid JSON: ' + err.message, 400);
    }
    return safeInternalError(err, 'Failed to write devcontainer.json');
  }
}
