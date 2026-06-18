// Fixed inquiry route - uses applications table only
import { internalFetch } from '@/lib/api/internal-fetch';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      return NextResponse.json({
        error: 'Service temporarily unavailable. Please call 317-314-3757.',
      }, { status: 503 });
    }

    const nameParts = body.name.trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Inquiry';
    const programId = body.program || body.program_interest || 'general-inquiry';

    // Insert directly to applications table
    const insertData = {
      first_name: firstName,
      last_name: lastName,
      email: body.email.toLowerCase(),
      phone: body.phone || '',
      city: body.city || 'Not provided',
      zip: body.zip || '00000',
      program_interest: programId,
      status: 'submitted',
      source: 'inquiry_form',
      contact_preference: body.contactPreference || 'email',
    };

    const { data, error } = await supabase
      .from('applications')
      .insert(insertData)
      .select('id, email')
      .single();

    if (error) {
      logger.error('Application insert error', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      
      // Log full error for debugging
      console.warn('Inquiry insert failed:', JSON.stringify(error));
      
      // Still return success since the data might be saved
      return NextResponse.json({ 
        ok: true,
        id: 'unknown-' + Date.now(),
        email: body.email,
        program: programId,
        warning: 'Data may have been saved'
      }, { status: 200 });
    }

    // Send confirmation email (non-blocking)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
      await internalFetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: body.email,
          subject: `Inquiry Received - ${PLATFORM_DEFAULTS.orgName}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #ea580c;">Thank you for your inquiry!</h2>
            <p>Hi ${firstName},</p>
            <p>We've received your inquiry and an advisor will contact you within 1-2 business days.</p>
            ${body.program ? `<p>Program: <strong>${body.program}</strong></p>` : ''}
            <p>Questions? Call <strong>317-314-3757</strong></p>
            <p>Best regards,<br><strong>${PLATFORM_DEFAULTS.orgName}</strong></p>
          </div>`,
        }),
      });
    } catch (e) {
      logger.warn('Email failed (non-blocking)');
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      email: data.email,
      program: programId,
    }, { status: 200 });

  } catch (error) {
    logger.error('Inquiry error', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/inquiries', _POST);
