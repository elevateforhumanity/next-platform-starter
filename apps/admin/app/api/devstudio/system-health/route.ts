import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const mode = (process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto').toLowerCase();
  const hasGitHub = Boolean(process.env.GITHUB_TOKEN);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  const checks = {
    devcontainerMode: mode,
    githubToken: hasGitHub,
    aiProviders: { hasOpenAI, hasGemini, hasAnthropic },
  };

  const warnings: string[] = [];
  if (mode === 'github-only' && !hasGitHub) warnings.push('github-only mode but GITHUB_TOKEN missing');
  if (!hasOpenAI && !hasGemini && !hasAnthropic) warnings.push('no AI provider keys configured');

  return NextResponse.json({
    ok: warnings.length === 0,
    checks,
    warnings,
    timestamp: new Date().toISOString(),
  });
}
