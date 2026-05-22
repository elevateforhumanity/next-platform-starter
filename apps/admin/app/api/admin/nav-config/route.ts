import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_NAV, isNavSections } from '@/lib/admin/nav-config';
import { safeError } from '@/lib/api/safe-error';

/**
 * GET /api/admin/nav-config
 *
 * Returns the admin nav sections. Source priority:
 *   1. platform_settings row with key = 'ADMIN_NAV_SECTIONS_JSON'
 *   2. DEFAULT_NAV hardcoded fallback
 *
 * PUT /api/admin/nav-config
 *
 * Saves a new nav config to platform_settings. Body: { sections: NavSection[] }
 * Validates that all hrefs start with /admin before persisting.
 */

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await requireAdminClient();
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'ADMIN_NAV_SECTIONS_JSON')
      .maybeSingle();

    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (isNavSections(parsed)) {
          return NextResponse.json({ sections: parsed, source: 'db' });
        }
      } catch {
        // fall through to default
      }
    }

    return NextResponse.json({ sections: DEFAULT_NAV, source: 'default' });
  } catch (err) {
    return safeError('Failed to load nav config', 500);
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { sections } = body as { sections?: unknown };
  if (!isNavSections(sections)) {
    return safeError('sections must be NavSection[] with /admin hrefs only', 400);
  }

  try {
    const supabase = await requireAdminClient();
    const { error } = await supabase
      .from('platform_settings')
      .upsert(
        { key: 'ADMIN_NAV_SECTIONS_JSON', value: JSON.stringify(sections) },
        { onConflict: 'key' },
      );

    if (error) return safeError('Failed to save nav config', 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return safeError('Failed to save nav config', 500);
  }
}
