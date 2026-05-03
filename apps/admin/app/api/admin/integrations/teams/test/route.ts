import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { sendTeamsMessage } from '@/lib/notifications/teams';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  if (!process.env.TEAMS_WEBHOOK_URL) {
    return safeError('TEAMS_WEBHOOK_URL is not configured.', 503);
  }

  try {
    await sendTeamsMessage(
      'Elevate LMS — Test Notification',
      'Teams integration is working correctly.',
      { 'Sent by': 'Admin integration test', Platform: 'Elevate for Humanity LMS' },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to send Teams test message');
  }
}
