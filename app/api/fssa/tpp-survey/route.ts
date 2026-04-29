// PUBLIC ROUTE: FSSA TPP survey submission — no auth required.
// Saves to platform_settings and sends notification email to Elizabeth.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError, safeInternalError } from '@/lib/api/safe-error';
import https from 'https';

const NOTIFY_EMAIL = 'elevate4humanityedu@gmail.com';
const FROM_EMAIL = 'noreply@elevateforhumanity.org';

function sendNotification(survey: Record<string, unknown>): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return Promise.resolve();

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: NOTIFY_EMAIL, name: 'Elizabeth Greene' }] }],
    from: { email: FROM_EMAIL, name: 'Elevate for Humanity' },
    subject: 'New FSSA TPP Survey Submission',
    content: [
      {
        type: 'text/plain',
        value: [
          'A new FSSA TPP survey has been submitted.',
          '',
          `Organization: ${survey.org_name}`,
          `Contact: ${survey.contact_name} — ${survey.contact_email}`,
          `Program: ${survey.program_name}`,
          `Total Participants: ${survey.total_participants}`,
          `SNAP Participants: ${survey.snap_participants}`,
          `Total Budget: $${survey.total_program_cost}`,
          `SNAP-Eligible Costs: $${survey.snap_eligible_costs}`,
          '',
          'Log in to /admin/fssa-impact to review.',
        ].join('\n'),
      },
    ],
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      () => resolve(),
    );
    req.on('error', () => resolve()); // non-fatal
    req.write(payload);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body?.org_name) return safeError('org_name is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Save with timestamp key so multiple submissions are preserved
  const key = `fssa_tpp_survey_${Date.now()}`;

  const { error } = await db.from('platform_settings').upsert(
    {
      key,
      value: JSON.stringify({ ...body, submitted_at: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  );

  if (error) return safeDbError(error, 'Failed to save survey');

  // Also overwrite the latest snapshot for easy admin access
  await db.from('platform_settings').upsert(
    {
      key: 'fssa_tpp_survey',
      value: JSON.stringify({ ...body, submitted_at: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  );

  // Notify Elizabeth — fire and forget
  sendNotification(body).catch(() => {});

  return NextResponse.json({ success: true });
}
