import { NextResponse } from 'next/server';

/**
 * This endpoint previously triggered a Netlify build hook.
 * The platform now deploys to AWS ECS via GitHub Actions on PR merge.
 * Netlify is no longer used — this route is intentionally disabled.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Netlify deployments are no longer supported. Deploys happen automatically via GitHub Actions on merge to main.' },
    { status: 410 },
  );
}
