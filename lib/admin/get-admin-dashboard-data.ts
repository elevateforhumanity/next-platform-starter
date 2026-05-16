// lib/admin/get-admin-dashboard-data.ts
// Single aggregation for the admin operations dashboard.
// Only queries tables that exist and have live data.
// No synthetic stats, no fake deltas.

import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  calculatePriorityScore,
  scoreSeverity,
  sortPriorityItems,
  type PriorityItem,
} from '@/lib/admin/priority-score';
import type { AdminDashboardData, DegradedSection } from '@/components/admin/dashboard/types';
import { getSystemHealth } from './dashboard/get-system-health';

function toSafeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}


/**
 * Asserts a critical count query succeeded.
 * Throws — callers must not coerce this to 0 on failure.
 */
function requireCount(
  result: { count: number | null; error: { message: string } | null },
  label: string
): number {
  if (result.error) throw new Error(`${label} query failed: ${result.error.message}`);
  if (result.count == null) throw new Error(`${label} count missing`);
  return result.count;
}

/**
 * Handles a non-critical rows query.
 * On failure: logs server-side, returns empty array, records the degraded section.
 * Never coerces failure into a normal-looking empty result silently.
 */
function optionalRows<T>(
  result: { data: T[] | null; error: { message: string } | null },
  section: DegradedSection,
  degraded: DegradedSection[]
): T[] {
  if (result.error) {
    logger.error(`[dashboard] ${section} query failed`, { message: result.error.message });
    degraded.push(section);
    return [];
  }
  return result.data ?? [];
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function lastMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
}

function lastMonthEnd() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const adminClient = await requireAdminClient();
  // Fall back to the anon client if the service role key is absent.
  // Queries that require elevated privileges will return empty results
  // rather than crashing the entire dashboard.
  const db = adminClient ?? supabase;

  const thisMonthStart  = monthStart();
  const lastMonthStartS = lastMonthStart();
  const lastMonthEndS   = lastMonthEnd();

  // ── All queries run in parallel — auth, profile, health, and data ─────────
  const [
    authRes,
    pendingAppsRes,
    allPendingAppsRes,
    activeEnrollmentsRes,
    lastMonthEnrollmentsRes,
    revenueRes,
    certsRes,
    certsThisMonthRes,
    enrollmentTrendRes,
    studentStatusesRes,
    lastMonthAppsRes,
    recentEnrollmentsRes,
    recentAppsActivityRes,
    pendingHoldersRes,
    pendingHolderDocsRes,
    pendingSubmissionsRes,
    complianceAlertsRes,
    staleLeadsRes,
    wioaDocsPendingRes,
    newLeadsTodayRes,
    newEnrollmentsTodayRes,
    stalledApplicationsRes,
    noOutcomeEnrollmentsRes,
    missingFundingEnrollmentsRes,
    systemHealthRes,
  ] = await Promise.all([
    // Auth — critical, but resolved here so it runs in parallel with DB queries
    supabase.auth.getUser(),
    db.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, program_slug, status, created_at, submitted_at')
      .in('status', ['submitted', 'pending', 'in_review'])
      .order('created_at', { ascending: true })
      .limit(20),

    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'pending', 'in_review']),

    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_state', 'active'),

    // Previous month active enrollments for delta
    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_state', 'active')
      .lt('created_at', lastMonthEndS),

    // Revenue — single RPC does conditional aggregation in Postgres.
    // Replaces 3 separate row-fetch queries that transferred all paid rows to JS.
    db.rpc('admin_revenue_summary', {
      month_start:       thisMonthStart,
      last_month_start:  lastMonthStartS,
      last_month_end:    lastMonthEndS,
    }),

    // Count from both tables — certificates (legacy) and program_completion_certificates (LMS engine)
    Promise.all([
      db.from('certificates').select('id', { count: 'exact', head: true }),
      db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]).then(([a, b]) => ({ count: (a.count ?? 0) + (b.count ?? 0), error: a.error ?? b.error })),

    // Certs issued this month — both tables
    Promise.all([
      db.from('certificates').select('id', { count: 'exact', head: true }).gte('issued_at', thisMonthStart),
      db.from('program_completion_certificates').select('id', { count: 'exact', head: true }).gte('issued_at', thisMonthStart),
    ]).then(([a, b]) => ({ count: (a.count ?? 0) + (b.count ?? 0), error: a.error ?? b.error })),

    // Enrollment trend — last 12 months from program_enrollments
    db.from('program_enrollments')
      .select('created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11, 1)).toISOString())
      .order('created_at', { ascending: true }),

    // Student status breakdown
    db.from('program_enrollments')
      .select('enrollment_state'),

    // Last month pending apps count for delta
    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'pending', 'in_review'])
      .gte('created_at', lastMonthStartS)
      .lt('created_at', lastMonthEndS),

    // Recent activity — last 20 enrollments + applications combined
    db.from('program_enrollments')
      .select('id, user_id, created_at, enrollment_state')
      .order('created_at', { ascending: false })
      .limit(10),

    db.from('applications')
      .select('id, first_name, last_name, full_name, program_interest, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),

    // Program holder pending applications
    db.from('program_holders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Program holder documents pending review
    db.from('program_holder_documents')
      .select('id', { count: 'exact', head: true })
      .is('approved', null),

    // Pending lab/assignment submissions awaiting instructor sign-off
    db.from('step_submissions')
      .select('id, user_id, course_lesson_id, step_type, submitted_at, status')
      .in('status', ['submitted', 'under_review'])
      .order('submitted_at', { ascending: true })
      .limit(10),

    // Compliance alerts — open/unresolved, for dashboard snapshot
    // Live schema: status TEXT (default 'open'), no boolean resolved column
    db.from('compliance_alerts')
      .select('id, alert_type, severity, title, description, created_at')
      .eq('status', 'open')
      .order('severity', { ascending: false })
      .limit(5),

    // Stale CRM leads — no activity in 5+ days, not closed
    // Real columns: first_name, last_name, email, status (not company_name/contact_name/stage)
    db.from('leads')
      .select('id, first_name, last_name, email, status, updated_at')
      .not('status', 'in', '(closed_won,closed_lost)')
      .lt('updated_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true })
      .limit(5),

    // WIOA documents pending review
    db.from('wioa_documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // New leads today
    db.from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // New enrollments today
    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // Operational alerts — stalled applications (7+ days in submitted/pending)
    db.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, program_slug, status, created_at, submitted_at')
      .in('status', ['submitted', 'pending', 'in_review'])
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
      .limit(10),

    // Completed enrollments with no outcome — participant_report view
    // Live columns: id, user_id, program_id, email, program_title, enrollment_status,
    // enrollment_state, first_name, last_name, program_slug
    // (enrollment_id, full_name, funding_source, outcome_type do NOT exist in live view)
    db.from('participant_report')
      .select('id, first_name, last_name, email, program_title, enrollment_state')
      .eq('enrollment_state', 'completed')
      .order('id', { ascending: true })
      .limit(10),

    // Active enrollments missing funding — exclude apprenticeship programs (barber/cosmetology are self-pay by design)
    db.from('program_enrollments')
      .select('id, user_id, program_id, program_slug, enrollment_state, funding_source')
      .in('enrollment_state', ['active', 'onboarding', 'enrolled'])
      .is('funding_source', null)
      .not('program_slug', 'like', '%apprenticeship%')
      .order('id', { ascending: true })
      .limit(10),

    // System health — runs in parallel with all other queries
    getSystemHealth(db).catch(() => ({
      stripeWebhookOk: false,
      buildEnvOk: false,
      staleJobs: 0,
      degraded: true,
      missingDocuments: 0,
      missingCertifications: 0,
      unresolvedFlags: 0,
      alerts: [{ code: 'health_check_failed', severity: 'warning' as const, message: 'System health check failed to load.' }],
    })),
  ]);

  // ── Resolve auth + profile from parallel result ───────────────────────────
  let adminProfile: { full_name: string | null; role: string } | null = null;
  const { data: { user }, error: authError } = authRes;
  if (authError) throw new Error(`Auth user fetch failed in getAdminDashboardData: ${authError.message}`);
  if (user) {
    const { data: profileData, error: profileError } = await db
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      logger.error('[getAdminDashboardData] profile fetch failed:', profileError);
    } else {
      adminProfile = profileData ?? null;
    }
  }

  // ── System health from parallel result ────────────────────────────────────
  const systemHealth = systemHealthRes;

  // Log failures but never throw — the error boundary shows a blank page with
  // no actionable info. A degraded dashboard is always better than a 500.
  if (pendingAppsRes.error) logger.error('[dashboard] applications query failed', pendingAppsRes.error);
  if (revenueRes.error)     logger.error('[dashboard] admin_revenue_summary RPC failed', revenueRes.error);

  const totalPendingCount    = requireCount(allPendingAppsRes,       'applications count');
  const activeEnrollCount    = requireCount(activeEnrollmentsRes,    'active enrollments');
  const lastMonthEnrollCount = lastMonthEnrollmentsRes.error ? 0 : (lastMonthEnrollmentsRes.count ?? 0);
  const lastMonthAppsCount   = lastMonthAppsRes.error ? 0 : (lastMonthAppsRes.count ?? 0);
  // certsRes is a combined count from certificates + program_completion_certificates
  const certsCount           = certsRes.error ? 0 : (certsRes.count ?? 0);
  const certsThisMonth       = certsThisMonthRes.error ? 0 : (certsThisMonthRes.count ?? 0);
  const pendingHoldersCount  = pendingHoldersRes.error ? 0 : (pendingHoldersRes.count ?? 0);
  const pendingHolderDocsCount = pendingHolderDocsRes.error ? 0 : (pendingHolderDocsRes.count ?? 0);
  const pendingSubmissions = pendingSubmissionsRes.error ? [] : (pendingSubmissionsRes.data ?? []);

  // ── Operational dashboard signals ─────────────────────────────────────────
  const complianceAlerts = complianceAlertsRes.error ? [] : (complianceAlertsRes.data ?? []);
  const staleLeadsData = staleLeadsRes.error ? [] : (staleLeadsRes.data ?? []);
  const pendingWioaDocs = wioaDocsPendingRes.error ? 0 : (wioaDocsPendingRes.count ?? 0);
  const newLeadsToday = newLeadsTodayRes.error ? 0 : (newLeadsTodayRes.count ?? 0);
  const newEnrollmentsToday = newEnrollmentsTodayRes.error ? 0 : (newEnrollmentsTodayRes.count ?? 0);

  const now2 = Date.now();
  const staleLeads = staleLeadsData.map((l: any) => ({
    id: l.id,
    name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || null,
    status: l.status ?? null,
    updated_at: l.updated_at ?? null,
    days_stale: l.updated_at ? Math.floor((now2 - new Date(l.updated_at).getTime()) / 86400000) : 0,
    href: `/admin/crm/leads/${l.id}`,
  }));

  // Track which non-critical sections failed — UI renders a partial-failure notice.
  // Declared here so optionalRows() can push into it during the second batch.
  const degradedSections: DegradedSection[] = [];

  // ── Non-critical queries — degrade gracefully on failure ──────────────────
  // Sidebar panels and supplemental lists. A failure here should not crash
  // the whole dashboard — it should just render an empty section.
  const [
    inactiveLearnersRes,
    unpublishedProgramsRes,
    recentStudentsRes,
    enrollmentsByProgramRes,
  ] = await Promise.all([
    // inactive_learners: single RPC replaces 4-query chain
    // (enrollments → lesson_progress filter → profiles → program names).
    db.rpc('admin_inactive_learners', { inactive_days: 3, limit_n: 20 }),

    db.from('programs')
      .select('id, title, slug, status, updated_at')
      .eq('published', false)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(10),

    // recent_students: select from profiles without the broken nested join.
    // program_enrollments.program_id FK → apprenticeship_programs, not programs,
    // so the nested join programs(name,title) fails. Resolve program names separately.
    db.from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(10),

    // enrollments_by_program: no join — FK points to wrong table (see above).
    // NOTE: program_enrollments uses enrollment_state not status.
    db.from('program_enrollments')
      .select('program_id, enrollment_state')
      .not('program_id', 'is', null)
      .limit(2000),
  ]);

  // ── Non-critical supplemental sections ───────────────────────────────────
  const inactiveLearnersData    = optionalRows(inactiveLearnersRes,    'inactive_learners',      degradedSections);
  const unpublishedProgramsData = optionalRows(unpublishedProgramsRes, 'unpublished_programs',   degradedSections);
  const recentStudentsData      = optionalRows(recentStudentsRes,      'recent_students',        degradedSections);
  const enrollmentsByProgramData = optionalRows(enrollmentsByProgramRes, 'enrollments_by_program', degradedSections);

  // ── Resolve program slugs → titles for applications ───────────────────────
  const rawSlugs = (pendingAppsRes.data ?? [])
    .map((a: any) => a.program_slug ?? a.program_interest)
    .filter(Boolean);
  const uniqueSlugs = [...new Set(rawSlugs)];
  const slugToTitle: Record<string, string> = {};
  if (uniqueSlugs.length > 0) {
    const { data: slugRows } = await db
      .from('programs')
      .select('slug, title, name')
      .in('slug', uniqueSlugs);
    for (const p of slugRows ?? []) {
      if (p.slug) slugToTitle[p.slug] = (p as any).title || (p as any).name || p.slug;
    }
  }

  // ── Applications with aging ───────────────────────────────────────────────
  const now = Date.now();
  const pendingApps = (pendingAppsRes.data ?? []).map((app: any) => {
    const createdAt = app.submitted_at || app.created_at;
    const ageDays = Math.floor((now - new Date(createdAt).getTime()) / 86400000);
    const slug = app.program_slug ?? app.program_interest ?? null;
    const resolvedProgram = slug ? (slugToTitle[slug] ?? slug) : null;
    return {
      id: app.id,
      first_name: app.first_name ?? null,
      last_name: app.last_name ?? null,
      full_name: app.full_name ?? null,
      email: app.email ?? null,
      program_interest: resolvedProgram,
      status: app.status ?? 'submitted',
      created_at: createdAt,
      submitted_at: app.submitted_at ?? null,
      age_days: ageDays,
      urgent: ageDays >= 3,
      href: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app.id)
        ? `/admin/applications/review/${app.id}`
        : `/admin/applications?search=${encodeURIComponent(app.email ?? app.id)}`,
    };
  });

  const totalPending = totalPendingCount;
  const oldestApp = pendingApps[0] ?? null;

  // ── Revenue — from admin_revenue_summary RPC (single row) ────────────────
  const revenueRow        = revenueRes.error ? null : ((revenueRes.data as any[])?.[0] ?? null);
  const revenueAllTimeCents   = toSafeNumber(revenueRow?.all_time_cents   ?? 0);
  const revenueThisMonthCents = toSafeNumber(revenueRow?.this_month_cents ?? 0);
  const revenueLastMonthCents = toSafeNumber(revenueRow?.last_month_cents ?? 0);

  // ── Enrollment trend — bucket by month ───────────────────────────────────
  const trendBuckets: Record<string, number> = {};
  for (const row of enrollmentTrendRes.data ?? []) {
    const d = new Date((row as any).created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendBuckets[key] = (trendBuckets[key] ?? 0) + 1;
  }
  // Build last 12 months in order, filling gaps with 0
  const enrollmentTrend: import('@/components/admin/dashboard/types').EnrollmentTrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    enrollmentTrend.push({ month: MONTH_SHORT[d.getMonth()], enrollments: trendBuckets[key] ?? 0 });
  }

  // ── Student status breakdown ──────────────────────────────────────────────
  const statusBuckets: Record<string, number> = {};
  for (const row of studentStatusesRes.data ?? []) {
    const s = (row as any).enrollment_state ?? 'unknown';
    statusBuckets[s] = (statusBuckets[s] ?? 0) + 1;
  }
  const studentStatuses: import('@/components/admin/dashboard/types').StatusPoint[] = Object.entries(statusBuckets)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  // ── KPI deltas — real month-over-month % change ───────────────────────────
  function pctDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const enrollDelta  = pctDelta(activeEnrollCount, lastMonthEnrollCount);
  const revDelta     = pctDelta(revenueThisMonthCents, revenueLastMonthCents);
  const appsDelta    = pctDelta(totalPendingCount, lastMonthAppsCount);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Pending Applications',
      value: totalPending,
      delta: appsDelta,
      deltaLabel: appsDelta !== 0
        ? `${appsDelta > 0 ? '+' : ''}${appsDelta}% vs last month`
        : 'No change vs last month',
      href: '/admin/applications?status=submitted,pending,in_review',
      urgent: totalPending > 0,
      sub: oldestApp
        ? `Oldest: ${oldestApp.age_days}d — ${oldestApp.program_interest || 'unknown program'}`
        : 'No pending applications',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollCount,
      delta: enrollDelta,
      deltaLabel: enrollDelta !== 0
        ? `${enrollDelta > 0 ? '+' : ''}${enrollDelta}% vs last month`
        : 'No change vs last month',
      href: '/admin/students?status=active',
      urgent: !degradedSections.includes('inactive_learners') && inactiveLearnersData.length > 0,
      sub: degradedSections.includes('inactive_learners')
        ? 'Could not load inactive learner data'
        : `${inactiveLearnersData.length} with no activity in 3+ days`,
    },
    {
      label: 'Revenue This Month',
      value: revenueThisMonthCents,
      delta: revDelta,
      deltaLabel: revDelta !== 0
        ? `${revDelta > 0 ? '+' : ''}${revDelta}% vs last month`
        : 'No change vs last month',
      href: '/admin/students?payment_status=paid',
      urgent: false,
      sub: `$${(revenueAllTimeCents / 100).toLocaleString('en-US')} collected all time`,
    },
    {
      label: 'Certificates Issued',
      value: certsCount,
      delta: certsThisMonth,
      deltaLabel: `${certsThisMonth} issued this month`,
      href: '/admin/certificates',
      urgent: false,
      sub: `${certsThisMonth} issued this month · ${certsCount} all time`,
    },
    {
      label: 'Pending Program Holders',
      value: pendingHoldersCount,
      delta: 0,
      deltaLabel: 'Awaiting approval',
      href: '/admin/program-holders',
      urgent: pendingHoldersCount > 0,
      sub: pendingHoldersCount > 0 ? 'Requires admin review' : 'No pending applications',
    },
    {
      label: 'Pending Documents',
      value: pendingHolderDocsCount,
      delta: 0,
      deltaLabel: 'Awaiting review',
      href: '/admin/program-holder-documents',
      urgent: pendingHolderDocsCount > 0,
      sub: pendingHolderDocsCount > 0 ? 'Program holder documents to review' : 'All documents reviewed',
    },
  ];

  // ── Blocked programs ──────────────────────────────────────────────────────
  const blockedPrograms = unpublishedProgramsData.map((p: any) => ({
    id: p.id,
    title: p.title ?? 'Untitled',
    slug: p.slug ?? '',
    status: p.status ?? 'draft',
    updatedAt: p.updated_at ?? '',
    href: `/admin/programs/${p.id}`,
  }));

  // ── Inactive learners — from admin_inactive_learners RPC ─────────────────
  // RPC returns fully-enriched rows (profiles + program names joined server-side).
  // Falls back to empty array if the RPC is not yet applied in Supabase.
  const nowMs = Date.now();
  const inactiveLearners = inactiveLearnersData.map((e: any) => {
    const lastActivityMs = e.last_activity ? new Date(e.last_activity).getTime()
      : e.enrolled_at ? new Date(e.enrolled_at).getTime() : nowMs;
    const daysInactive = Math.floor((nowMs - lastActivityMs) / 86_400_000);
    return {
      enrollmentId: e.enrollment_id ?? e.id,
      userId: e.user_id,
      enrolledAt: e.enrolled_at ?? '',
      fullName: e.full_name ?? null,
      email: e.email ?? null,
      daysInactive,
      programTitle: e.program_title ?? null,
      href: `/admin/students/${e.user_id}`,
    };
  });

  // ── Priority items — scored and sorted ───────────────────────────────────
  // Computed here so inactiveLearners, staleLeads, and pendingApps are all available.
  const rawPriorityItems: PriorityItem[] = [];

  // Compliance alerts
  for (const a of complianceAlerts as any[]) {
    const daysOpen = a.created_at
      ? Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000)
      : 0;
    const risk = a.severity === 'critical' ? 5 : a.severity === 'high' ? 4 : a.severity === 'medium' ? 2 : 1;
    const score = calculatePriorityScore({ type: 'compliance', days: Math.max(0, daysOpen - 1), risk, blocked: true });
    rawPriorityItems.push({
      id: a.id,
      type: 'compliance',
      label: a.title ?? `Compliance alert: ${a.alert_type ?? 'unknown'}`,
      href: '/admin/compliance',
      score,
      severity: scoreSeverity(score),
      context: `${daysOpen}d open · ${a.severity ?? 'unknown'} severity`,
    });
  }

  // Stale CRM leads
  for (const l of staleLeads) {
    const score = calculatePriorityScore({ type: 'lead', days: Math.max(0, l.days_stale - 5), money: 3 });
    rawPriorityItems.push({
      id: l.id,
      type: 'lead',
      label: `Stale lead: ${l.name ?? 'Unknown'}`,
      href: l.href,
      score,
      severity: scoreSeverity(score),
      context: `${l.days_stale}d no activity · ${l.status ?? 'No status'}`,
    });
  }

  // Pending WIOA docs — one aggregate item
  if (pendingWioaDocs > 0) {
    const score = calculatePriorityScore({ type: 'wioa', risk: 3, money: 2, blocked: true });
    rawPriorityItems.push({
      id: 'wioa-docs',
      type: 'wioa',
      label: `${pendingWioaDocs} WIOA document${pendingWioaDocs !== 1 ? 's' : ''} awaiting review`,
      href: '/admin/wioa/documents',
      score,
      severity: scoreSeverity(score),
      context: 'Funding eligibility may be blocked',
    });
  }

  // Pending enrollments — one aggregate item
  if (totalPendingCount > 0) {
    const urgentApp = pendingApps.find(a => a.urgent);
    const daysOverdue = urgentApp ? Math.max(0, Math.floor((Date.now() - new Date(urgentApp.created_at).getTime()) / 86400000) - 3) : 0;
    const score = calculatePriorityScore({ type: 'enrollment', days: daysOverdue, money: 3, blocked: true });
    rawPriorityItems.push({
      id: 'pending-enrollments',
      type: 'enrollment',
      label: `${totalPendingCount} enrollment${totalPendingCount !== 1 ? 's' : ''} pending review`,
      href: '/admin/applications?status=submitted',
      score,
      severity: scoreSeverity(score),
      context: urgentApp ? 'Oldest is 3+ days old' : 'Awaiting admin review',
    });
  }

  // Failed jobs
  const failedJobCount = systemHealth.staleJobs ?? 0;
  if (failedJobCount > 0) {
    const score = calculatePriorityScore({ type: 'system', risk: 4, blocked: true });
    rawPriorityItems.push({
      id: 'failed-jobs',
      type: 'system',
      label: `${failedJobCount} failed job${failedJobCount !== 1 ? 's' : ''} in queue`,
      href: '/admin/system/jobs',
      score,
      severity: scoreSeverity(score),
      context: 'Requires investigation',
    });
  }

  // Inactive learners — one aggregate item
  if (inactiveLearners.length > 0) {
    const score = calculatePriorityScore({ type: 'learner', days: Math.max(0, inactiveLearners[0]?.daysInactive - 7), risk: 1 });
    rawPriorityItems.push({
      id: 'inactive-learners',
      type: 'learner',
      label: `${inactiveLearners.length} learner${inactiveLearners.length !== 1 ? 's' : ''} inactive 7+ days`,
      href: '/admin/at-risk',
      score,
      severity: scoreSeverity(score),
      context: `Most inactive: ${inactiveLearners[0]?.daysInactive ?? 0}d`,
    });
  }

  const priorities = sortPriorityItems(rawPriorityItems).slice(0, 10);

  // ── Operational signals ───────────────────────────────────────────────────
  const needsReviewTotal = totalPendingCount + pendingWioaDocs;
  const needsReviewParts: string[] = [];
  if (totalPendingCount > 0) needsReviewParts.push(`${totalPendingCount} enrollment${totalPendingCount !== 1 ? 's' : ''}`);
  if (pendingWioaDocs > 0) needsReviewParts.push(`${pendingWioaDocs} WIOA doc${pendingWioaDocs !== 1 ? 's' : ''}`);

  const newTodayTotal = newLeadsToday + newEnrollmentsToday;
  const newTodayParts: string[] = [];
  if (newLeadsToday > 0) newTodayParts.push(`${newLeadsToday} lead${newLeadsToday !== 1 ? 's' : ''}`);
  if (newEnrollmentsToday > 0) newTodayParts.push(`${newEnrollmentsToday} enrollment${newEnrollmentsToday !== 1 ? 's' : ''}`);

  const highSeverityAlert = complianceAlerts.find((a: any) => a.severity === 'critical' || a.severity === 'high');

  const operational = {
    needsReview: needsReviewTotal,
    needsReviewDetail: needsReviewParts.length > 0 ? needsReviewParts.join(' and ') : 'Nothing pending right now',
    atRisk: inactiveLearners.length,
    complianceAlerts: complianceAlerts.length,
    complianceAlertsSeverity: highSeverityAlert ? (highSeverityAlert as any).severity : null,
    newToday: newTodayTotal,
    newTodayDetail: newTodayParts.length > 0 ? newTodayParts.join(', ') : 'Nothing new today',
    revenueThisMonthCents,
  };

  // ── Recent students ───────────────────────────────────────────────────────
  // Resolve each student's most recent enrollment + program name.
  // Step 1: fetch enrollments (needed to know which program_ids to look up).
  // Step 2: fetch program names (depends on step 1 result — sequential by necessity).
  const recentStudentIds = recentStudentsData.map((s: any) => s.id).filter(Boolean);
  const studentProgramMap: Record<string, string | null> = {};
  const enrollStatusByUser: Record<string, string> = {};
  if (recentStudentIds.length > 0) {
    const { data: enrollmentRows } = await db
      .from('program_enrollments')
      .select('user_id, program_id, enrollment_state')
      .in('user_id', recentStudentIds)
      .order('created_at', { ascending: false });

    const seenUsers = new Set<string>();
    const programIdByUser: Record<string, string> = {};
    for (const row of enrollmentRows ?? []) {
      const uid = (row as any).user_id;
      if (uid && !seenUsers.has(uid)) {
        seenUsers.add(uid);
        programIdByUser[uid] = (row as any).program_id;
        enrollStatusByUser[uid] = (row as any).enrollment_state ?? null;
      }
    }
    const uniqueProgramIds = [...new Set(Object.values(programIdByUser))].filter(Boolean);
    if (uniqueProgramIds.length > 0) {
      const { data: programNameRows } = await db
        .from('programs')
        .select('id, name, title')
        .in('id', uniqueProgramIds);
      const nameById: Record<string, string> = {};
      for (const p of programNameRows ?? []) {
        nameById[p.id] = (p as any).name || (p as any).title || p.id.slice(0, 8);
      }
      for (const [uid, pid] of Object.entries(programIdByUser)) {
        studentProgramMap[uid] = nameById[pid] ?? null;
      }
    }
  }
  const recentStudents = recentStudentsData.map((s: any) => ({
    id: s.id,
    full_name: s.full_name ?? null,
    email: s.email ?? null,
    enrollment_status: enrollStatusByUser?.[s.id] ?? null,
    created_at: s.created_at ?? null,
    program_name: studentProgramMap[s.id] ?? null,
    href: `/admin/students/${s.id}`,
  }));

  // ── Programs by enrollment ────────────────────────────────────────────────
  // First pass: aggregate counts by program_id (no join — FK points to wrong table).
  const programTotals: Record<string, { total: number; completed: number }> = {};
  for (const e of enrollmentsByProgramData) {
    const pid = (e as any).program_id as string | null;
    if (!pid) continue;
    if (!programTotals[pid]) programTotals[pid] = { total: 0, completed: 0 };
    programTotals[pid].total += 1;
    if ((e as any).enrollment_state === 'completed') programTotals[pid].completed += 1;
  }

  // Second pass: fetch program names for the top program IDs only.
  const topProgramIds = Object.entries(programTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([id]) => id);

  // Fetch program names and recent enrollment profiles in parallel — independent queries
  const recentEnrollUserIds = (recentEnrollmentsRes.data ?? [])
    .map((e: any) => e.user_id).filter(Boolean);

  const [programRowsRes, rProfilesRes] = await Promise.all([
    topProgramIds.length > 0
      ? db.from('programs').select('id, name, title').in('id', topProgramIds)
      : Promise.resolve({ data: [] }),
    recentEnrollUserIds.length > 0
      ? db.from('profiles').select('id, full_name, email').in('id', recentEnrollUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  const programNamesMap: Record<string, string> = {};
  for (const p of programRowsRes.data ?? []) {
    programNamesMap[(p as any).id] = (p as any).name || (p as any).title || (p as any).id.slice(0, 8);
  }

  const topPrograms = topProgramIds.map(id => {
    const p = programTotals[id];
    return {
      id,
      title: programNamesMap[id] ?? id.slice(0, 8),
      learners: toSafeNumber(p.total),
      completed: toSafeNumber(p.completed),
      completionRate: p.total > 0 ? clampPercent((p.completed / p.total) * 100) : 0,
    };
  });

  // ── Recent activity — merge enrollments + applications, sort by date ────────
  const recentEnrollProfileMap: Record<string, string> = {};
  for (const p of rProfilesRes.data ?? []) {
    recentEnrollProfileMap[(p as any).id] = (p as any).full_name || (p as any).email || 'Unknown';
  }

  const enrollActivityItems = (recentEnrollmentsRes.data ?? []).map((e: any) => ({
    id: `enroll-${e.id}`,
    title: `${recentEnrollProfileMap[e.user_id] ?? 'A student'} enrolled`,
    timestamp: e.created_at,
  }));

  const appActivityItems = (recentAppsActivityRes.data ?? []).map((a: any) => {
    const name = a.full_name || [a.first_name, a.last_name].filter(Boolean).join(' ') || 'Someone';
    return {
      id: `app-${a.id}`,
      title: `${name} applied — ${a.program_interest ?? 'unknown program'}`,
      timestamp: a.created_at,
    };
  });

  const recentActivityItems = [...enrollActivityItems, ...appActivityItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const sitePreviewTargets = [
    {
      label: 'Public Site',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    },
    {
      label: 'Admin',
      url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
    },
    {
      label: 'LMS',
      url: process.env.NEXT_PUBLIC_LMS_URL || 'https://admin.elevateforhumanity.org/lms',
    },
  ];

  return {
    counts: {
      pendingApplications:   totalPendingCount,
      activeEnrollments:     activeEnrollCount,
      revenueThisMonthCents: revenueThisMonthCents,
      certificatesIssued:    certsCount,
      pendingProgramHolders: pendingHoldersCount,
      pendingDocuments:      pendingHolderDocsCount,
    },
    operational,
    priorities,
    kpis,
    enrollmentTrend,
    studentStatuses,
    topPrograms,
    recentActivity: recentActivityItems,
    recentStudents,
    recentApplications: pendingApps,
    blockedPrograms,
    inactiveLearners,
    pendingSubmissions,
    complianceAlerts,
    staleLeads,
    pendingWioaDocs,
    stalledApplications: stalledApplicationsRes.data ?? [],
    noOutcomeEnrollments: noOutcomeEnrollmentsRes.data ?? [],
    missingFundingEnrollments: missingFundingEnrollmentsRes.data ?? [],
    profile: adminProfile,
    generatedAt: new Date().toISOString(),
    sitePreviewTargets,
    degradedSections,
    systemHealth,
  };
}
