/**
 * GET /api/cron/missed-checkins
 * Flag apprentices who missed their scheduled OJT check-in window.
 * Runs every 30 minutes. Complements missed-clockout.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Expected check-in window: 8 AM–10 AM local. Flag if no clock-in by 10:30 AM.
const CHECKIN_DEADLINE_HOUR = 10;
const CHECKIN_DEADLINE_MINUTE = 30;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Only run during business hours (8 AM–2 PM UTC window)
  const utcHour = now.getUTCHours();
  if (utcHour < 13 || utcHour > 19) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'outside_window' });
  }

  // Active apprentices enrolled in OJT programs
  const { data: apprentices, error } = await db
    .from('program_enrollments')
    .select('id, user_id, program_id, profiles!program_enrollments_user_id_fkey(full_name, email)')
    .eq('status', 'active')
    .eq('enrollment_type', 'apprenticeship')
    .limit(200);

  if (error) {
    logger.error('[cron/missed-checkins] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Check who has clocked in today
  const userIds = (apprentices ?? []).map((a: any) => a.user_id);
  if (!userIds.length) return NextResponse.json({ ok: true, missed: 0 });

  const { data: clockedIn } = await db
    .from('progress_entries')
    .select('user_id')
    .in('user_id', userIds)
    .gte('clock_in', `${today}T00:00:00Z`)
    .lt('clock_in', `${today}T23:59:59Z`);

  const clockedInSet = new Set((clockedIn ?? []).map((r: any) => r.user_id));
  const missed = (apprentices ?? []).filter((a: any) => !clockedInSet.has(a.user_id));

  for (const apprentice of missed) {
    const profile = (apprentice as any).profiles;
    await db.from('notifications').insert({
      user_id: apprentice.user_id,
      type: 'action_required',
      title: 'Missed check-in',
      message: 'You have not clocked in for your OJT session today. Please clock in or contact your supervisor.',
      action_url: '/lms/timeclock',
      link: '/lms/timeclock',
      read: false,
      idempotency_key: `missed-checkin-${apprentice.user_id}-${today}`,
    }).onConflict('idempotency_key').ignore().catch(() => {});
  }

  logger.info('[cron/missed-checkins] Done', { total_apprentices: apprentices?.length ?? 0, missed: missed.length });
  return NextResponse.json({ ok: true, total_apprentices: apprentices?.length ?? 0, missed: missed.length });
});
