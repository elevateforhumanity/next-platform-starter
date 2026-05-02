export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { protectTestEndpoint } from '@/lib/api/protect-test-endpoint';
import { safeInternalError } from '@/lib/api/safe-error';

export const GET = protectTestEndpoint(async () => {
  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const urlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30);

    // Try to create admin client
    let clientCreated = false;
    const clientError = null;
    try {
      const db = await requireAdminClient();
      clientCreated = true;

      // Try a simple query
      const { data, error }: any = await supabase.from('applications').select('count').limit(1);

      return NextResponse.json({
        status: 'success',
        environment: {
          hasUrl,
          hasServiceKey,
          hasAnonKey,
          urlPrefix,
        },
        client: {
          created: clientCreated,
        },
        database: {
          querySuccess: !error,
          error: error
            ? { code: (error as any)?.code || 'UNKNOWN', hint: (error as any)?.hint ?? null }
            : null,
        },
      });
    } catch {
      return NextResponse.json({
        status: 'error',
        environment: { hasUrl, hasServiceKey, hasAnonKey, urlPrefix },
        client: { created: false, error: 'Client initialization failed' },
      });
    }
  } catch {
    return NextResponse.json({ status: 'error', message: 'Diagnostic check failed' });
  }
});
