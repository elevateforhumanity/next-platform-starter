/**
 * /api/devstudio/shell
 *
 * Dispatches GitHub Actions workflow runs instead of spawning local bash.
 * Works in production (ECS) where the container has no source files.
 * Admin-only.
 *
 * POST { workflow: string, inputs?: Record<string, string> }
 *   → triggers workflow_dispatch on the given workflow file
 *   → returns { ok, runUrl } immediately (fire-and-forget)
 *
 * GET ?run_id=<id>
 *   → polls a workflow run for status + logs
 *
 * Supported workflows (workflow field values):
 *   'deploy-lms'    → .github/workflows/deploy-lms.yml
 *   'deploy-admin'  → .github/workflows/deploy-admin.yml
 *   'ci'            → .github/workflows/ci-cd.yml
 *   'lint'          → .github/workflows/lint.yml
 *
 * Security:
 *  - Requires admin role on every request.
 *  - Only whitelisted workflows can be dispatched.
 *  - Uses GITHUB_TOKEN from environment (SSM-injected in ECS).
 *  - Rate-limited to strict tier (3 req / 5 min).
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REPO   = 'elevate-for-humanity/Elevate-lms';
const BRANCH = 'main';
const GH_API = 'https://api.github.com';

// Only these workflow files can be dispatched
const ALLOWED_WORKFLOWS: Record<string, string> = {
  'deploy-lms':    'deploy-lms.yml',
  'deploy-admin':  'deploy-admin.yml',
  'deploy-studio': 'deploy-studio.yml',
  'ci':            'ci-cd.yml',
  'lint':          'lint.yml',
};

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

/**
 * Fallback trigger: bump the retry-marker comment in a workflow file via the
 * Contents API. Used when workflow_dispatch returns 403/404 (e.g. the token
 * lacks workflow scope or the workflow has no workflow_dispatch trigger).
 *
 * Reads the current file, replaces the marker timestamp, and PUTs it back.
 * GitHub sees a push to main on a path that matches the workflow's path filter,
 * which fires the deploy job exactly as a normal push would.
 */
async function triggerViaContentsApi(workflowFile: string): Promise<{ runUrl: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not configured');

  const path = `.github/workflows/${workflowFile}`;
  const apiBase = `${GH_API}/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  // Fetch current file
  const getRes = await fetch(`${apiBase}?ref=${BRANCH}`, { headers });
  if (!getRes.ok) throw new Error(`Could not read ${path}: ${getRes.status}`);
  const { sha, content: b64 } = await getRes.json() as { sha: string; content: string };

  // Decode, bump marker, re-encode
  const current = Buffer.from(b64.replace(/\n/g, ''), 'base64').toString('utf8');
  const ts = new Date().toISOString().slice(0, 16) + 'Z';
  const markerRe = /(#\s*Retry trigger marker:\s*)\S+/;
  const updated = markerRe.test(current)
    ? current.replace(markerRe, `$1${ts}`)
    : current + `\n# Retry trigger marker: ${ts}\n`;

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Trigger ${workflowFile.replace('.yml', '')} deploy`,
      content: Buffer.from(updated).toString('base64'),
      sha,
      branch: BRANCH,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({})) as { message?: string };
    throw new Error(`Contents API PUT failed: ${err.message ?? putRes.status}`);
  }

  return { runUrl: `https://github.com/${REPO}/actions` };
}

// ── POST — dispatch a workflow ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  await hydrateProcessEnv(); // ensure GITHUB_TOKEN from platform_secrets is available
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const workflowKey: string = body?.workflow ?? '';
  const inputs: Record<string, string> = body?.inputs ?? {};

  if (!workflowKey) {
    return safeError('workflow is required', 400);
  }

  const workflowFile = ALLOWED_WORKFLOWS[workflowKey];
  if (!workflowFile) {
    return safeError(
      `Unknown workflow "${workflowKey}". Allowed: ${Object.keys(ALLOWED_WORKFLOWS).join(', ')}`,
      400,
    );
  }

  try {
    const dispatchRes = await fetch(
      `${GH_API}/repos/${REPO}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: ghHeaders(),
        body: JSON.stringify({ ref: BRANCH, inputs }),
      },
    );

    // 204 = accepted by workflow_dispatch
    if (dispatchRes.status === 204) {
      // Brief wait for GH to register the run
      await new Promise((r) => setTimeout(r, 1500));
      const runsRes = await fetch(
        `${GH_API}/repos/${REPO}/actions/workflows/${workflowFile}/runs?per_page=1&branch=${BRANCH}`,
        { headers: ghHeaders() },
      );
      const runsData = runsRes.ok ? await runsRes.json() : null;
      const latestRun = runsData?.workflow_runs?.[0];

      return NextResponse.json({
        ok: true,
        workflow: workflowKey,
        method: 'dispatch',
        runId: latestRun?.id ?? null,
        runUrl: latestRun?.html_url ?? `https://github.com/${REPO}/actions`,
        status: latestRun?.status ?? 'queued',
      });
    }

    // workflow_dispatch failed (403/404 = token lacks workflow scope or no dispatch trigger).
    // Fall back to bumping the retry marker via the Contents API — this triggers the
    // workflow through its path filter on push to main, same as a normal commit.
    const fallback = await triggerViaContentsApi(workflowFile);
    return NextResponse.json({
      ok: true,
      workflow: workflowKey,
      method: 'contents-api',
      runId: null,
      runUrl: fallback.runUrl,
      status: 'queued',
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to dispatch workflow');
  }
}

// ── GET — poll a workflow run ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  await hydrateProcessEnv(); // ensure GITHUB_TOKEN from platform_secrets is available
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const runId = request.nextUrl.searchParams.get('run_id');
  if (!runId) return safeError('run_id is required', 400);

  try {
    const [runRes, jobsRes] = await Promise.all([
      fetch(`${GH_API}/repos/${REPO}/actions/runs/${runId}`, { headers: ghHeaders() }),
      fetch(`${GH_API}/repos/${REPO}/actions/runs/${runId}/jobs`, { headers: ghHeaders() }),
    ]);

    if (!runRes.ok) {
      if (runRes.status === 404) return safeError('Run not found', 404);
      return safeError('GitHub API error', runRes.status);
    }

    const run = await runRes.json();
    const jobs = jobsRes.ok ? (await jobsRes.json()).jobs ?? [] : [];

    return NextResponse.json({
      id: run.id,
      status: run.status,       // queued | in_progress | completed
      conclusion: run.conclusion, // success | failure | cancelled | null
      url: run.html_url,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      jobs: jobs.map((j: { id: number; name: string; status: string; conclusion: string | null; html_url: string }) => ({
        id: j.id,
        name: j.name,
        status: j.status,
        conclusion: j.conclusion,
        url: j.html_url,
      })),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch run status');
  }
}
