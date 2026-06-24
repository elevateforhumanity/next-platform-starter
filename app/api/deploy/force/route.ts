import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

// Vercel Deploy Hook (configure in environment variables)
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO_URL || 'owner/repo';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check - require admin role
    await requireRole('admin');

    const { environment = 'production', bypass_checks = true, reason = '' } = await request.json();

    // Log the deployment attempt
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('audit_log').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        action: 'force_deploy_attempt',
        resource: 'production',
        details: JSON.stringify({
          environment,
          bypass_checks,
          reason,
          timestamp: new Date().toISOString(),
        }),
        created_at: new Date().toISOString(),
      });
    }

    // Check if Vercel deploy hook is configured
    if (!VERCEL_DEPLOY_HOOK) {
      // Return simulated success for demo purposes
      return NextResponse.json({
        success: true,
        message: 'Demo mode - Vercel hook not configured',
        url: 'https://www.elevateforhumanity.org',
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        mode: 'demo',
      });
    }

    // Trigger Vercel deployment
    const deployResponse = await fetch(VERCEL_DEPLOY_HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!deployResponse.ok) {
      throw new Error('Vercel deployment trigger failed');
    }

    // Log successful deployment
    if (user) {
      await supabase.from('deployments').insert({
        id: crypto.randomUUID(),
        service: 'production',
        environment: 'production',
        status: 'success',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        commit_sha: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment triggered successfully',
      url: 'https://www.elevateforhumanity.org',
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      mode: 'production',
    });

  } catch (error) {
    console.error('Force deploy error:', error);

    // Log failure
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('audit_log').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        action: 'force_deploy_failed',
        resource: 'production',
        details: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    );
  }
}
