import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import fs from 'fs/promises';
import path from 'path';

const DEVCONTAINER_PATH = path.join(process.cwd(), '.devcontainer', 'devcontainer.json');

// devcontainer.json is a small config file — 64 KB is a generous upper bound
const MAX_CONTENT_BYTES = 64 * 1024;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const raw = await fs.readFile(DEVCONTAINER_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return NextResponse.json({ raw, parsed });
  } catch (err) {
    return safeInternalError(err, 'Failed to read devcontainer.json');
  }
}

export async function PUT(request: NextRequest) {
  // Writes to the filesystem — use strict tier (3 req / 5 min)
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || typeof content !== 'string') {
      return safeError('content is required', 400);
    }

    // Reject oversized payloads before touching the filesystem
    if (Buffer.byteLength(content, 'utf-8') > MAX_CONTENT_BYTES) {
      return safeError(`content exceeds maximum size of ${MAX_CONTENT_BYTES / 1024} KB`, 413);
    }

    // Validate JSON before writing so we never corrupt the file
    JSON.parse(content);

    await fs.writeFile(DEVCONTAINER_PATH, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return safeError('Invalid JSON: ' + err.message, 400);
    }
    return safeInternalError(err, 'Failed to write devcontainer.json');
  }
}
