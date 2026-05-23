import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const dynamic = 'force-dynamic';
// Moved to supersonicfastermoney.com
const TARGET = 'https://www.supersonicfastermoney.com';
export async function GET(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const url = new URL(req.url);
  return NextResponse.redirect(TARGET + url.pathname.replace('/app/api/tax-intake', '') + url.search, 308);
}
export async function POST(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(TARGET + url.pathname.replace('/app/api/tax-intake', '') + url.search, 308);
}
