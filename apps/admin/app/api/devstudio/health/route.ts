/**
 * GET /api/devstudio/health
 *
 * Safe diagnostics for Dev Studio — returns boolean flags only, never secret values.
 * Admin-only. Use this to confirm which providers are visible to the admin container.
 *
 * Expected response when healthy:
 *   { "hasGroq": true, "hasGemini": true, "runtime": "nodejs", "service": "admin" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isGroqConfigured } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  // Hydrate so app_secrets values are merged before checking
  await hydrateProcessEnv();

  return NextResponse.json({
    hasGroq:      isGroqConfigured(),
    hasGemini:    isGeminiConfigured(),
    hasOpenAI:    !!process.env.OPENAI_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasGitHub:    !!process.env.GITHUB_TOKEN,
    runtime:      'nodejs',
    service:      'admin',
    nodeEnv:      process.env.NODE_ENV ?? 'unknown',
  });
}
