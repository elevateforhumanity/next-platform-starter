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
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REPO   = 'elevateforhumanity/Elevate-lms';
const BRANCH = 'main';
const GH_API = 'https://api.github.com';

// Only these workflow files can be dispatched
const ALLOWED_WORKFLOWS: Record<string, string> = {
  'deploy-lms':   'deploy-lms.yml',
  'deploy-admin': 'deploy-admin.yml',
  'ci':           'ci-cd.yml',
  'lint':         'lint.yml',
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

// ── POST — dispatch a workflow ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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
    const res = await fetch(
      `${GH_API}/repos/${REPO}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: ghHeaders(),
        body: JSON.stringify({ ref: BRANCH, inputs }),
      },
    );

    // 204 = accepted, no body
    if (res.status === 204) {
      // Fetch the most recent run to return its URL
      await new Promise((r) => setTimeout(r, 1500)); // brief wait for GH to register the run
      const runsRes = await fetch(
        `${GH_API}/repos/${REPO}/actions/workflows/${workflowFile}/runs?per_page=1&branch=${BRANCH}`,
        { headers: ghHeaders() },
      );
      const runsData = runsRes.ok ? await runsRes.json() : null;
      const latestRun = runsData?.workflow_runs?.[0];

      return NextResponse.json({
        ok: true,
        workflow: workflowKey,
        runId: latestRun?.id ?? null,
        runUrl: latestRun?.html_url ?? `https://github.com/${REPO}/actions`,
        status: latestRun?.status ?? 'queued',
      });
    }

    const err = await res.json().catch(() => ({}));
    return safeError((err as { message?: string }).message ?? 'GitHub API error', res.status);
  } catch (err) {
    return safeInternalError(err, 'Failed to dispatch workflow');
  }
}

// ── GET — poll a workflow run ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
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
