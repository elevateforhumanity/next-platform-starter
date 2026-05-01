// PUBLIC ROUTE: staff position application form
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const formData = await request.formData();

    const data = {
      role: formData.get('role') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || '',
      qualifications: formData.get('qualifications') as string,
    };

    if (!data.role || !data.email || !data.first_name || !data.last_name || !data.qualifications) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['staff', 'instructor'].includes(data.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;
    const normalizedEmail = data.email.toLowerCase().trim();

    const { error: appError } = await supabase
      .from('applications')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        normalized_email: normalizedEmail,
        normalized_phone: data.phone.replace(/\D/g, ''),
        city: 'Not provided',
        zip: '00000',
        application_type: 'staff',
        type: data.role,
        program_interest: data.role,
        reference_number: referenceNumber,
        status: 'submitted',
        source: 'staff-application',
        support_notes: `Role: ${data.role} | Qualifications: ${data.qualifications}`,
      });

    if (appError) {
      logger.error('[apply/staff] DB insert failed', { message: appError.message });
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/apply/staff/success', request.url));
  } catch (error) {
    logger.error('[apply/staff] Unexpected error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/apply/staff', _POST);
