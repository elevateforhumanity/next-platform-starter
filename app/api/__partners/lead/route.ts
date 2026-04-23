// PUBLIC ROUTE: partner lead capture form — stores lead in DB, no CRM dependency

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const { name, email, phone, company, programInterest } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('partner_leads').insert({
    name,
    email,
    phone: phone || null,
    company: company || null,
    program_interest: programInterest || null,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const POST = withApiAudit('/api/partners/lead', _POST);
