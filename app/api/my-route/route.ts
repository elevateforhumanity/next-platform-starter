import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export async function GET() {
  return NextResponse.json({ error: 'Example documentation route. No production operation is attached.' }, { status: 410 });
}
