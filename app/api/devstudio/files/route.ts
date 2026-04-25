/**
 * /api/devstudio/files
 *
 * Read and write files from the repo root. Admin-only.
 *
 * GET  ?path=app/page.tsx          → returns file content + metadata
 * GET  ?path=app&tree=1            → returns directory tree (2 levels deep)
 * PUT  { path, content }           → writes file content
 * POST { path, type: 'file'|'dir' } → creates new file or directory
 * DELETE { path }                  → deletes file or empty directory
 *
 * Security:
 *  - All paths are resolved relative to process.cwd() and checked to stay
 *    within the repo root (no path traversal).
 *  - .env* files and node_modules are blocked from read and write.
 *  - Requires admin role on every request.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const MAX_FILE_BYTES = 512 * 1024; // 512 KB

// Paths that must never be read or written
const BLOCKED_PATTERNS = [
  /^\.env/,
  /node_modules/,
  /\.git\//,
  /\.next\//,
];

function resolveSafe(filePath: string): string | null {
  const resolved = path.resolve(ROOT, filePath);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) return null;
  const rel = path.relative(ROOT, resolved);
  if (BLOCKED_PATTERNS.some((p) => p.test(rel))) return null;
  return resolved;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

async function buildTree(dir: string, relBase: string, depth: number): Promise<TreeNode[]> {
  if (depth < 0) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];
  for (const entry of entries) {
    const rel = path.join(relBase, entry.name);
    if (BLOCKED_PATTERNS.some((p) => p.test(rel))) continue;
    if (entry.name.startsWith('.') && entry.name !== '.devcontainer') continue;
    if (entry.isDirectory()) {
      const children = depth > 0 ? await buildTree(path.join(dir, entry.name), rel, depth - 1) : [];
      nodes.push({ name: entry.name, path: rel, type: 'directory', children });
    } else {
      nodes.push({ name: entry.name, path: rel, type: 'file' });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const filePath = searchParams.get('path') ?? '';
  const tree = searchParams.get('tree') === '1';

  if (!filePath) {
    // Return repo root tree
    const nodes = await buildTree(ROOT, '', 2);
    return NextResponse.json({ tree: nodes });
  }

  const resolved = resolveSafe(filePath);
  if (!resolved) return safeError('Path not allowed', 403);

  try {
    const stat = await fs.stat(resolved);

    if (stat.isDirectory() || tree) {
      const depth = tree ? 2 : 1;
      const nodes = await buildTree(resolved, filePath, depth);
      return NextResponse.json({ path: filePath, type: 'directory', children: nodes });
    }

    if (stat.size > MAX_FILE_BYTES) {
      return safeError(`File exceeds ${MAX_FILE_BYTES / 1024} KB read limit`, 413);
    }

    const content = await fs.readFile(resolved, 'utf-8');
    const ext = path.extname(filePath).slice(1);
    return NextResponse.json({ path: filePath, content, size: stat.size, ext });
  } catch (err: any) {
    if (err.code === 'ENOENT') return safeError('File not found', 404);
    return safeInternalError(err, 'Failed to read file');
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path || typeof body.content !== 'string') {
    return safeError('path and content are required', 400);
  }

  const resolved = resolveSafe(body.path);
  if (!resolved) return safeError('Path not allowed', 403);

  if (Buffer.byteLength(body.content, 'utf-8') > MAX_FILE_BYTES) {
    return safeError(`Content exceeds ${MAX_FILE_BYTES / 1024} KB write limit`, 413);
  }

  try {
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, body.content, 'utf-8');
    return NextResponse.json({ ok: true, path: body.path });
  } catch (err) {
    return safeInternalError(err, 'Failed to write file');
  }
}

// ── POST (create) ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path) return safeError('path is required', 400);

  const resolved = resolveSafe(body.path);
  if (!resolved) return safeError('Path not allowed', 403);

  try {
    if (body.type === 'dir') {
      await fs.mkdir(resolved, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      // Don't overwrite existing files
      await fs.writeFile(resolved, body.content ?? '', { flag: 'wx', encoding: 'utf-8' });
    }
    return NextResponse.json({ ok: true, path: body.path });
  } catch (err: any) {
    if (err.code === 'EEXIST') return safeError('File already exists', 409);
    return safeInternalError(err, 'Failed to create');
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.path) return safeError('path is required', 400);

  const resolved = resolveSafe(body.path);
  if (!resolved) return safeError('Path not allowed', 403);

  try {
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      await fs.rmdir(resolved); // fails if non-empty — intentional
    } else {
      await fs.unlink(resolved);
    }
    return NextResponse.json({ ok: true, path: body.path });
  } catch (err: any) {
    if (err.code === 'ENOENT') return safeError('File not found', 404);
    if (err.code === 'ENOTEMPTY') return safeError('Directory is not empty', 409);
    return safeInternalError(err, 'Failed to delete');
  }
}
