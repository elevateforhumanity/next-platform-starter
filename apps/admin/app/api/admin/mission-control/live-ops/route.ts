import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/mission-control/live-ops
 * Returns clock-in feed, platform event alerts, and active lesson activity.
 * Polled every 30s by MissionControlClient.
 */
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [clockInsRes, eventsRes, lessonProgressRes] = await Promise.all([
    // Active clock-ins: clocked in but not yet out in last 24h
    db
      .from('progress_entries')
      .select('id, apprentice_id, clock_in_at, clock_out_at, work_date, hours_worked, program_id')
      .gte('clock_in_at', since)
      .order('clock_in_at', { ascending: false })
      .limit(30),

    // Platform events: warnings/errors/critical in last 24h
    db
      .from('platform_events')
      .select('id, event_type, category, severity, message, created_at, payload, resolved')
      .gte('created_at', since)
      .in('severity', ['warning', 'error', 'critical'])
      .order('created_at', { ascending: false })
      .limit(20),

    // Recent lesson completions in last 24h
    db
      .from('lesson_progress')
      .select('id, user_id, lesson_id, completed_at, created_at')
      .gte('created_at', since)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  // Enrich clock-ins with profile names
  const clockIns = clockInsRes.data ?? [];
  const apprenticeIds = [...new Set(clockIns.map((c: any) => c.apprentice_id).filter(Boolean))];
  const { data: profiles } = apprenticeIds.length
    ? await db.from('profiles').select('id, full_name').in('id', apprenticeIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name]));

  const enrichedClockIns = clockIns.map((c: any) => ({
    ...c,
    student_name: profileMap[c.apprentice_id] ?? 'Unknown',
    is_active: !c.clock_out_at,
    duration_min: c.clock_in_at
      ? Math.round((Date.now() - new Date(c.clock_in_at).getTime()) / 60000)
      : null,
  }));

  // Enrich lesson completions with profile names
  const lessonProgress = lessonProgressRes.data ?? [];
  const learnerIds = [...new Set(lessonProgress.map((l: any) => l.user_id).filter(Boolean))];
  const { data: learnerProfiles } = learnerIds.length
    ? await db.from('profiles').select('id, full_name').in('id', learnerIds)
    : { data: [] };
  const learnerMap = Object.fromEntries((learnerProfiles ?? []).map((p: any) => [p.id, p.full_name]));

  const enrichedProgress = lessonProgress.map((l: any) => ({
    ...l,
    student_name: learnerMap[l.user_id] ?? 'Unknown',
  }));

  // Summary counts
  const activeClockIns = enrichedClockIns.filter((c: any) => c.is_active).length;
  const unresolvedAlerts = (eventsRes.data ?? []).filter((e: any) => !e.resolved).length;

  return NextResponse.json({
    clockIns: enrichedClockIns,
    alerts: eventsRes.data ?? [],
    recentLessonActivity: enrichedProgress,
    summary: {
      activeClockIns,
      unresolvedAlerts,
      lessonCompletions24h: enrichedProgress.length,
    },
  });
}
