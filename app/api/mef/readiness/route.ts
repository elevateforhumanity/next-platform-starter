import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
// Moved to supersonicfastermoney.com
const TARGET = 'https://www.supersonicfastermoney.com';
export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(TARGET + url.pathname.replace('/app/api/mef', '') + url.search, 308);
}
export async function POST(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(TARGET + url.pathname.replace('/app/api/mef', '') + url.search, 308);
}
