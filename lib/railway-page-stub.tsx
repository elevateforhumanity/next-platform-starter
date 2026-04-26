/**
 * lib/railway-page-stub.tsx
 *
 * Empty stub injected by webpack NormalModuleReplacementPlugin for all
 * non-Railway app routes during the Railway build. Prevents Next.js from
 * compiling ~1,100 public marketing pages that are served by Netlify.
 *
 * This file is never served — Railway's proxy.ts routes public traffic
 * back to Netlify before it reaches these stubs.
 */

import { notFound } from 'next/navigation';

// Default export satisfies page.tsx contract
export default function RailwayStub() {
  notFound();
}

// Named exports satisfy layout.tsx / route.ts contracts
export function GET() {
  return notFound();
}
export function POST() {
  return notFound();
}
export const dynamic = 'force-dynamic';
