// PUBLIC ROUTE: public program catalog

// GET /api/catalog
// Public, rate-limited. Returns paginated, filtered results from published `programs`.
// Query params:
//   q           — text search (title, slug, credential, description)
//   category    — program category
//   wioa        — 'true' to filter WIOA-eligible only
//   state       — state code (default IN)
//   provider    — tenant slug
//   page        — 1-based (default 1)
//   per_page    — max 50 (default 20)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { loadProgramCatalog } from '@/lib/programs/load-program-catalog';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const category = searchParams.get('category') ?? '';
  const wioaOnly = searchParams.get('wioa') === 'true';
  const state = searchParams.get('state') ?? '';
  const providerSlug = searchParams.get('provider') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));

  try {
    const supabase = await createClient();
    const result = await loadProgramCatalog(supabase, {
      q,
      category,
      wioaOnly,
      state,
      providerSlug,
      page,
      perPage,
    });

    if (result.error) {
      return safeInternalError(new Error(result.error), 'Failed to fetch catalog');
    }

    return NextResponse.json(
      {
        programs: result.programs,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      },
    );
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch catalog');
  }
}
