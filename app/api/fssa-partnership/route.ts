// PUBLIC ROUTE: 410 tombstone — endpoint moved to SNAP intake workflows, no auth needed
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has moved to SNAP intake workflows.' },
    { status: 410 },
  );
}
