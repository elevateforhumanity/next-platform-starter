/**
 * GET /api/devstudio/health
 *
 * Safe diagnostics for Dev Studio - returns boolean flags only, never secret values.
 * Admin-only. Use this to confirm which providers are visible to the admin container
 * and whether the studio shell is actually reachable and repo-ready.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isGroqConfigured } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { isOpenAIConfigured } from '@/lib/ai/openai-client';
import { isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { probeStudioShell } from '@/lib/devstudio/shell-probe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  await refreshSecrets().catch(() => {});

  let dbGroq = false, dbGemini = false, dbOpenAI = false,
      dbAnthropic = false, dbGitHub = false;
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('platform_secrets')
      .select('key, value_enc')
      .in('key', ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN']);
    for (const row of data ?? []) {
      const set = !!(row.value_enc && row.value_enc.length > 10);
      if (row.key === 'GROQ_API_KEY') dbGroq = set;
      if (row.key === 'GEMINI_API_KEY') dbGemini = set;
      if (row.key === 'OPENAI_API_KEY') dbOpenAI = set;
      if (row.key === 'ANTHROPIC_API_KEY') dbAnthropic = set;
      if (row.key === 'GITHUB_TOKEN') dbGitHub = set;
    }
  } catch {
    // non-fatal - fall back to process.env only
  }

  const shellWsUrl = process.env.STUDIO_SHELL_WS_URL ?? '';
  const shellSecret = process.env.STUDIO_SHELL_SECRET ?? '';
  const tokenSecret = process.env.STUDIO_TOKEN_SECRET ?? '';
  const shellWsPublic = process.env.STUDIO_SHELL_WS_URL_PUBLIC ?? '';
  const shellProbe = await probeShell(shellWsUrl);

  const shell = {
    STUDIO_SHELL_WS_URL: shellWsUrl ? 'configured' : 'MISSING',
    STUDIO_SHELL_SECRET: shellSecret ? 'configured' : 'MISSING',
    STUDIO_TOKEN_SECRET: tokenSecret ? 'configured' : 'MISSING',
    STUDIO_SHELL_WS_URL_PUBLIC: shellWsPublic ? 'configured' : 'MISSING',
    configured: !!(shellWsUrl && shellSecret && tokenSecret),
    ready: !!(shellWsUrl && shellSecret && tokenSecret && shellProbe.ready),
    probe: shellProbe,
  };

  return NextResponse.json({
    hasGroq: isGroqConfigured() || dbGroq,
    hasGemini: isGeminiConfigured() || dbGemini,
    hasOpenAI: !!process.env.OPENAI_API_KEY || dbOpenAI,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY || dbAnthropic,
    hasGitHub: !!process.env.GITHUB_TOKEN || dbGitHub,
    shell,
    runtime: 'nodejs',
    service: 'admin',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
  });
}
