import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has moved to SNAP intake workflows.' },
    { status: 410 },
  );
}
