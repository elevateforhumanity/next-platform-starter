// PUBLIC ROUTE: tax appointment booking — no auth required
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { sendTeamsMessage } from '@/lib/notifications/teams';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const body = await request.json();
    const { name, email, phone, service_type, preferred_date, preferred_time, notes } = body;

    if (!name || !email || !service_type) {
      return safeError('name, email, and service_type are required', 400);
    }

    const db = getAdminClient();
    const { data, error } = await db
      .from('tax_appointments')
      .insert({
        name,
        email,
        phone: phone ?? null,
        service_type,
        preferred_date: preferred_date ?? null,
        preferred_time: preferred_time ?? null,
        notes: notes ?? null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) return safeError('Failed to book appointment', 500);

    await sendTeamsMessage(
      `📅 New tax appointment request\n**${name}** (${email}) — ${service_type}\nPreferred: ${preferred_date ?? 'flexible'} ${preferred_time ?? ''}`
    ).catch(() => {});

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to book appointment');
  }
}
