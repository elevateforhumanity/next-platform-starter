// PUBLIC ROUTE: employer partnership application form
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
      company_name: formData.get('company_name') as string,
      industry: (formData.get('industry') as string) || '',
      company_size: (formData.get('company_size') as string) || '',
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || '',
      hiring_needs: (formData.get('hiring_needs') as string) || '',
    };

    if (!data.company_name || !data.email || !data.first_name || !data.last_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
        application_type: 'employer',
        type: 'employer',
        program_interest: 'Employer Partnership',
        reference_number: referenceNumber,
        status: 'submitted',
        source: 'employer-application',
        support_notes: [
          `Company: ${data.company_name}`,
          data.industry ? `Industry: ${data.industry}` : '',
          data.company_size ? `Size: ${data.company_size}` : '',
          data.hiring_needs ? `Hiring Needs: ${data.hiring_needs}` : '',
        ].filter(Boolean).join(' | '),
      });

    if (appError) {
      logger.error('[apply/employer] DB insert failed', { message: appError.message });
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/apply/employer/success', request.url));
  } catch (error) {
    logger.error('[apply/employer] Unexpected error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/apply/employer', _POST);
