// WIOA performance report endpoint.
// Returns participant counts by status, entered employment, retention, and credential attainment.
// Required for WIOA Title I quarterly reporting to Indiana DWD / EmployIndy.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowed = ['admin', 'super_admin', 'staff', 'workforce_board'];
  if (!profile || !allowed.includes(profile.role)) return safeError('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? new Date(Date.now() - 90 * 86400000).toISOString();
  const to   = searchParams.get('to')   ?? new Date().toISOString();
  const format = searchParams.get('format') ?? 'json'; // json | csv

  try {
    // Participants enrolled in WIOA-funded programs in period
    const { data: enrollments, error: enrollErr } = await supabase
      .from('program_enrollments')
      .select(`
        id, enrollment_state, created_at, completed_at,
        user_id,
        programs(title, slug, wioa_approved)
      `)
      .gte('created_at', from)
      .lte('created_at', to);

    if (enrollErr) return safeDbError(enrollErr, 'Failed to fetch enrollments');

    // Placement outcomes in period
    const { data: placements, error: placErr } = await supabase
      .from('applications')
      .select('id, user_id, placed_at, placement_employer, placement_job_title, placement_hourly_wage, retained_at, follow_up_6mo_at, follow_up_6mo_employed, follow_up_12mo_at, follow_up_12mo_employed')
      .not('placed_at', 'is', null)
      .gte('placed_at', from)
      .lte('placed_at', to);

    if (placErr) return safeDbError(placErr, 'Failed to fetch placements');

    // Credentials earned in period
    const { data: credentials, error: credErr } = await supabase
      .from('program_completion_certificates')
      .select('id, user_id, issued_at, program_id')
      .gte('issued_at', from)
      .lte('issued_at', to);

    if (credErr) return safeDbError(credErr, 'Failed to fetch credentials');

    const report = {
      period: { from, to },
      generated_at: new Date().toISOString(),
      participants: {
        total:     enrollments?.length ?? 0,
        active:    enrollments?.filter(e => e.enrollment_state === 'active').length ?? 0,
        completed: enrollments?.filter(e => ['completed','graduated'].includes(e.enrollment_state)).length ?? 0,
        withdrawn: enrollments?.filter(e => e.enrollment_state === 'withdrawn').length ?? 0,
      },
      outcomes: {
        entered_employment:       placements?.length ?? 0,
        retained_6mo:             placements?.filter(p => p.follow_up_6mo_employed).length ?? 0,
        retained_12mo:            placements?.filter(p => p.follow_up_12mo_employed).length ?? 0,
        credentials_attained:     credentials?.length ?? 0,
        avg_hourly_wage:          placements?.length
          ? Math.round((placements.reduce((s, p) => s + (p.placement_hourly_wage ?? 0), 0) / placements.length) * 100) / 100
          : 0,
      },
      raw: format === 'full' ? { enrollments, placements, credentials } : undefined,
    };

    if (format === 'csv') {
      const rows = [
        ['Metric', 'Value'],
        ['Period From', from],
        ['Period To', to],
        ['Total Participants', report.participants.total],
        ['Active', report.participants.active],
        ['Completed', report.participants.completed],
        ['Withdrawn', report.participants.withdrawn],
        ['Entered Employment', report.outcomes.entered_employment],
        ['Retained 6 Months', report.outcomes.retained_6mo],
        ['Retained 12 Months', report.outcomes.retained_12mo],
        ['Credentials Attained', report.outcomes.credentials_attained],
        ['Avg Hourly Wage', report.outcomes.avg_hourly_wage],
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wioa-report-${from.slice(0,10)}-${to.slice(0,10)}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (err) {
    return safeInternalError(err, 'Failed to generate WIOA report');
  }
}
