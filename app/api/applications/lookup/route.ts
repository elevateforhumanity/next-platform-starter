// PUBLIC ROUTE: look up an existing application by email + program
// Used when a returning applicant tries to pay but already has an application on file.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.toLowerCase().trim();
  const program = url.searchParams.get('program')?.trim();

  if (!email || !program) {
    return NextResponse.json({ error: 'email and program required' }, { status: 400 });
  }

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('applications')
    .select('id, status, intake_stage, created_at')
    .eq('email', email)
    .eq('program_slug', program)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ id: data.id, status: data.status, intake_stage: data.intake_stage });
}
