/**
 * /api/devstudio/git
 *
 * Git operations for Dev Studio — runs inside the Gitpod environment
 * where the repo is checked out at /workspaces/Elevate-lms.
 *
 * GET  ?action=status   → git status + branch + recent commits
 * GET  ?action=diff&file=path  → git diff for a file (or all)
 * GET  ?action=log      → recent commits
 * GET  ?action=branches → local + remote branches
 * POST { action: 'commit', message, files? }  → stage files + commit
 * POST { action: 'push' }                     → git push origin main
 * POST { action: 'checkout', branch }         → checkout or create branch
 * POST { action: 'pull' }                     → git pull
 *
 * Admin-only. Runs git commands via execSync in the workspace.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { execSync } from 'child_process';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPO_DIR = '/workspaces/Elevate-lms';

function git(cmd: string, opts?: { timeout?: number }): string {
  return execSync(`git -C ${REPO_DIR} ${cmd}`, {
    timeout: opts?.timeout ?? 15000,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      // Use stored GitHub token for push/pull if available
      GIT_ASKPASS: 'echo',
    },
  }).trim();
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';
  const file   = request.nextUrl.searchParams.get('file') ?? '';

  try {
    if (action === 'status') {
      const branch  = git('rev-parse --abbrev-ref HEAD');
      const status  = git('status --porcelain');
      const ahead   = (() => { try { return git('rev-list --count @{u}..HEAD'); } catch { return '0'; } })();
      const behind  = (() => { try { return git('rev-list --count HEAD..@{u}'); } catch { return '0'; } })();
      const log     = git('log --oneline -10 --pretty=format:"%h|%s|%an|%ar"');

      const changed = status.split('\n').filter(Boolean).map(line => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3),
      }));

      const commits = log.split('\n').filter(Boolean).map(line => {
        const [hash, subject, author, when] = line.split('|');
        return { hash, subject, author, when };
      });

      return NextResponse.json({ branch, changed, commits, ahead: +ahead, behind: +behind });
    }

    if (action === 'diff') {
      const target = file ? `-- ${file}` : '';
      const diff = git(`diff HEAD ${target}`, { timeout: 10000 });
      return NextResponse.json({ diff });
    }

    if (action === 'log') {
      const log = git('log --oneline -30 --pretty=format:"%h|%s|%an|%ar|%D"');
      const commits = log.split('\n').filter(Boolean).map(line => {
        const [hash, subject, author, when, refs] = line.split('|');
        return { hash, subject, author, when, refs };
      });
      return NextResponse.json({ commits });
    }

    if (action === 'branches') {
      const local  = git('branch --format="%(refname:short)"').split('\n').filter(Boolean);
      const remote = (() => {
        try { return git('branch -r --format="%(refname:short)"').split('\n').filter(Boolean); }
        catch { return []; }
      })();
      const current = git('rev-parse --abbrev-ref HEAD');
      return NextResponse.json({ local, remote, current });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/git] GET failed', { action, err });
    return safeInternalError(err, 'Git operation failed');
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { action: string; message?: string; files?: string[]; branch?: string };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { action } = body;

  try {
    if (action === 'commit') {
      const msg = (body.message ?? '').trim();
      if (!msg) return safeError('commit message required', 400);

      // Stage specified files or all changes
      if (body.files?.length) {
        for (const f of body.files) {
          git(`add -- ${f}`);
        }
      } else {
        git('add -A');
      }

      // Check if there's anything to commit
      const staged = git('diff --cached --name-only');
      if (!staged.trim()) {
        return NextResponse.json({ ok: false, message: 'Nothing to commit — working tree clean' });
      }

      git(`commit -m ${JSON.stringify(msg)} --author="Admin Studio <admin@elevateforhumanity.org>"`);
      const hash = git('rev-parse --short HEAD');
      return NextResponse.json({ ok: true, hash, message: msg });
    }

    if (action === 'push') {
      const branch = git('rev-parse --abbrev-ref HEAD');

      // Block direct push to main/master — production deploys go through
      // GitHub Actions on PR merge, not browser-triggered git push.
      if (branch === 'main' || branch === 'master') {
        return NextResponse.json({
          ok: false,
          error: `Direct push to "${branch}" is blocked. Create a feature branch, then open a PR to merge.`,
          blocked: true,
        }, { status: 403 });
      }

      const ghToken = process.env.GITHUB_TOKEN ?? '';
      if (ghToken) {
        try {
          git(`remote set-url origin https://${ghToken}@github.com/elevate-for-humanity/Elevate-lms.git`);
        } catch { /* non-fatal */ }
      }
      const out = git(`push origin ${branch}`, { timeout: 30000 });
      return NextResponse.json({ ok: true, branch, output: out });
    }

    if (action === 'pull') {
      const out = git('pull --rebase', { timeout: 30000 });
      return NextResponse.json({ ok: true, output: out });
    }

    if (action === 'checkout') {
      const branch = (body.branch ?? '').trim();
      if (!branch) return safeError('branch name required', 400);
      // Create if doesn't exist
      try {
        git(`checkout ${branch}`);
      } catch {
        git(`checkout -b ${branch}`);
      }
      return NextResponse.json({ ok: true, branch });
    }

    if (action === 'stash') {
      git('stash');
      return NextResponse.json({ ok: true });
    }

    if (action === 'stash-pop') {
      git('stash pop');
      return NextResponse.json({ ok: true });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/git] POST failed', { action, err });
    return safeInternalError(err, 'Git operation failed');
  }
}
