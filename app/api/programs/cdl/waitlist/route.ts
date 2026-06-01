// PUBLIC ROUTE: legacy CDL waitlist endpoint — enrollment is open; directs to apply.

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APPLY_URL = '/apply?program=cdl-training';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  return NextResponse.json(
    {
      error:
        'CDL enrollment is now open. Please complete your application using the link below.',
      applyUrl: APPLY_URL,
    },
    { status: 410 },
  );
}
