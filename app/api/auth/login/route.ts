// PUBLIC ROUTE: login endpoint — no auth possible
/**
 * @deprecated No active callers. Canonical endpoint is /api/auth/signin.
 * Kept to avoid 404s from any external integrations — redirects to signin.
 * Do not add new callers.
 */
import { NextResponse } from 'next/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

function redirectToSignin(request: Request): NextResponse {
  return NextResponse.redirect(new URL('/api/auth/signin', request.url), 308);
}

const _POST = async (request: Request) => redirectToSignin(request);
const _GET = async (request: Request) => redirectToSignin(request);
export const GET = withApiAudit('/api/auth/login', _GET);
export const POST = withApiAudit('/api/auth/login', _POST);
