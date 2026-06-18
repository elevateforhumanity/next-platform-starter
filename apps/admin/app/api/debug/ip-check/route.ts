import { NextResponse } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mockRequest = {
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return '10.0.0.1';
        return null;
      },
    },
    nextUrl: { pathname: '/test' },
  } as any;
  
  const blocked = checkAdminIP(mockRequest);
  const ipAllowlist = process.env.ADMIN_IP_ALLOWLIST ?? '(not set)';
  
  return NextResponse.json({
    ipAllowlist,
    blocked: blocked !== null,
    message: blocked ? 'blocked' : 'allowed',
  });
}
