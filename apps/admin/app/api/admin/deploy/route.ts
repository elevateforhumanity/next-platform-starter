import { NextResponse } from 'next/server';

/**
 * Legacy deploy trigger — use /api/admin/env-vars/deploy to trigger
 * AWS CodeBuild builds for LMS and Admin.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/admin/env-vars/deploy to trigger a CodeBuild deploy.' },
    { status: 410 },
  );
}
