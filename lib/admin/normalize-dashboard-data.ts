import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import type {
  AdminDashboardData,
  DashboardCounts,
  InactiveLearner,
  KPICard,
  OperationalCounts,
  RecentApplication,
  RecentStudent,
  SitePreviewTarget,
  TopProgramPoint,
} from '@/components/admin/dashboard/types';
import type { PriorityItem } from '@/lib/admin/priority-score';

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function asObjectArray<T extends object>(value: T[] | null | undefined): T[] {
  return asArray(value).filter((item): item is T => item != null && typeof item === 'object');
}

function asCount(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.length;
  return fallback;
}

const PRIORITY_SEVERITIES = new Set<PriorityItem['severity']>([
  'critical',
  'high',
  'medium',
  'low',
]);

function normalizeKpis(kpis: KPICard[] | null | undefined): KPICard[] {
  return asObjectArray(kpis).map((kpi) => ({
    label: typeof kpi.label === 'string' ? kpi.label : 'Metric',
    value: asCount(kpi.value),
    delta: asCount(kpi.delta),
    deltaLabel: typeof kpi.deltaLabel === 'string' ? kpi.deltaLabel : '',
    href: typeof kpi.href === 'string' ? kpi.href : '/admin/dashboard',
    urgent: kpi.urgent === true,
    sub: typeof kpi.sub === 'string' ? kpi.sub : undefined,
  }));
}

function normalizePriorities(items: PriorityItem[] | null | undefined): PriorityItem[] {
  return asObjectArray(items).map((item) => ({
    id: String(item.id ?? 'priority'),
    type: item.type ?? 'system',
    label: typeof item.label === 'string' ? item.label : 'Operational item',
    href: typeof item.href === 'string' ? item.href : '/admin/operations',
    score: asCount(item.score),
    severity: PRIORITY_SEVERITIES.has(item.severity) ? item.severity : 'low',
    context: typeof item.context === 'string' ? item.context : '',
  }));
}

function normalizeOperational(
  operational: Partial<OperationalCounts> | null | undefined,
): OperationalCounts {
  const base = getDegradedAdminDashboardData().operational;
  const raw = operational ?? {};
  return {
    needsReview: asCount(raw.needsReview, base.needsReview),
    needsReviewDetail:
      typeof raw.needsReviewDetail === 'string' ? raw.needsReviewDetail : base.needsReviewDetail,
    atRisk: asCount(raw.atRisk, base.atRisk),
    complianceAlerts: asCount(raw.complianceAlerts, base.complianceAlerts),
    complianceAlertsSeverity:
      typeof raw.complianceAlertsSeverity === 'string' ? raw.complianceAlertsSeverity : null,
    newToday: asCount(raw.newToday, base.newToday),
    newTodayDetail:
      typeof raw.newTodayDetail === 'string' ? raw.newTodayDetail : base.newTodayDetail,
    newAppsToday: asCount(raw.newAppsToday, base.newAppsToday),
    newLeadsToday: asCount(raw.newLeadsToday, base.newLeadsToday),
    newEnrollmentsToday: asCount(raw.newEnrollmentsToday, base.newEnrollmentsToday),
    revenueThisMonthCents: asCount(raw.revenueThisMonthCents, base.revenueThisMonthCents),
  };
}

function normalizeSystemHealth(
  health: Partial<AdminDashboardData['systemHealth']> | null | undefined,
): AdminDashboardData['systemHealth'] {
  const base = getDegradedAdminDashboardData().systemHealth;
  const raw = health ?? {};
  const alerts = asObjectArray(raw.alerts).map((alert) => ({
    code: typeof alert.code === 'string' ? alert.code : 'unknown',
    severity:
      alert.severity === 'critical' || alert.severity === 'warning' || alert.severity === 'info'
        ? alert.severity
        : 'warning',
    message: typeof alert.message === 'string' ? alert.message : 'System health alert',
  }));
  return {
    stripeWebhookOk: raw.stripeWebhookOk === true,
    stripeIssuingOk: raw.stripeIssuingOk === true,
    buildEnvOk: raw.buildEnvOk === true,
    staleJobs: asCount(raw.staleJobs, base.staleJobs),
    degraded: raw.degraded === true || alerts.some((a) => a.severity === 'critical'),
    missingDocuments: asCount(raw.missingDocuments, base.missingDocuments),
    missingCertifications: asCount(raw.missingCertifications, base.missingCertifications),
    unresolvedFlags: asCount(raw.unresolvedFlags, base.unresolvedFlags),
    alerts: alerts.length ? alerts : base.alerts,
  };
}

function normalizeProfile(
  profile: AdminDashboardData['profile'] | null | undefined,
): AdminDashboardData['profile'] {
  if (!profile || typeof profile !== 'object') return null;
  return {
    full_name: typeof profile.full_name === 'string' ? profile.full_name : null,
    role: typeof profile.role === 'string' ? profile.role : 'admin',
  };
}

function normalizeSitePreviewTargets(
  targets: SitePreviewTarget[] | null | undefined,
  fallback: SitePreviewTarget[],
): SitePreviewTarget[] {
  const rows = asObjectArray(targets)
    .map((target) => {
      const url = typeof target.url === 'string' ? target.url.trim() : '';
      if (!url) return null;
      const label =
        typeof target.label === 'string' && target.label.trim()
          ? target.label.trim()
          : url;
      return { label, url };
    })
    .filter((row): row is SitePreviewTarget => row != null);
  return rows.length ? rows : fallback;
}

function normalizeRecentStudents(students: RecentStudent[] | null | undefined): RecentStudent[] {
  return asObjectArray(students)
    .map((student) => {
      const id = String(student.id ?? '').trim();
      if (!id) return null;
      return {
        id,
        full_name: typeof student.full_name === 'string' ? student.full_name : null,
        email: typeof student.email === 'string' ? student.email : null,
        enrollment_status:
          typeof student.enrollment_status === 'string' ? student.enrollment_status : null,
        created_at: typeof student.created_at === 'string' ? student.created_at : null,
        program_name: typeof student.program_name === 'string' ? student.program_name : null,
        href:
          typeof student.href === 'string' && student.href.startsWith('/')
            ? student.href
            : `/admin/students/${id}`,
      };
    })
    .filter((row): row is RecentStudent => row != null);
}

function normalizeInactiveLearners(
  learners: InactiveLearner[] | null | undefined,
): InactiveLearner[] {
  return asObjectArray(learners)
    .map((learner) => {
      const enrollmentId = String(learner.enrollmentId ?? learner.userId ?? '').trim();
      const userId = String(learner.userId ?? '').trim();
      if (!enrollmentId && !userId) return null;
      const daysInactive = asCount(learner.daysInactive);
      return {
        enrollmentId: enrollmentId || userId,
        userId: userId || enrollmentId,
        enrolledAt: typeof learner.enrolledAt === 'string' ? learner.enrolledAt : '',
        fullName: typeof learner.fullName === 'string' ? learner.fullName : null,
        email: typeof learner.email === 'string' ? learner.email : null,
        daysInactive,
        programTitle: typeof learner.programTitle === 'string' ? learner.programTitle : null,
        href:
          typeof learner.href === 'string' && learner.href.startsWith('/')
            ? learner.href
            : `/admin/students/${userId || enrollmentId}`,
      };
    })
    .filter((row): row is InactiveLearner => row != null);
}

function normalizeTopPrograms(programs: TopProgramPoint[] | null | undefined): TopProgramPoint[] {
  return asObjectArray(programs)
    .map((program) => {
      const id = String(program.id ?? '').trim();
      const title = typeof program.title === 'string' ? program.title : 'Program';
      if (!id) return null;
      return {
        id,
        title,
        learners: asCount(program.learners),
        completed: asCount(program.completed),
        completionRate: asCount(program.completionRate),
      };
    })
    .filter((row): row is TopProgramPoint => row != null);
}

function normalizeRecentApplications(
  applications: RecentApplication[] | null | undefined,
): RecentApplication[] {
  return asObjectArray(applications).map((app) => ({
    id: String(app.id ?? `app-${Math.random().toString(36).slice(2)}`),
    first_name: typeof app.first_name === 'string' ? app.first_name : null,
    last_name: typeof app.last_name === 'string' ? app.last_name : null,
    full_name: typeof app.full_name === 'string' ? app.full_name : null,
    email: typeof app.email === 'string' ? app.email : null,
    program_interest: typeof app.program_interest === 'string' ? app.program_interest : null,
    status: typeof app.status === 'string' ? app.status : 'submitted',
    created_at: typeof app.created_at === 'string' ? app.created_at : new Date().toISOString(),
    submitted_at: typeof app.submitted_at === 'string' ? app.submitted_at : null,
    age_days: asCount(app.age_days),
    urgent: app.urgent === true,
    href:
      typeof app.href === 'string' && app.href.startsWith('/')
        ? app.href
        : '/admin/applications',
  }));
}

function normalizeCounts(
  counts: Partial<DashboardCounts> | null | undefined,
  pendingApplicationsListLength: number,
): DashboardCounts {
  const base = getDegradedAdminDashboardData().counts;
  const raw = counts ?? {};
  return {
    pendingApplications: asCount(raw.pendingApplications, pendingApplicationsListLength),
    activeEnrollments: asCount(raw.activeEnrollments, base.activeEnrollments),
    revenueThisMonthCents: asCount(raw.revenueThisMonthCents, base.revenueThisMonthCents),
    certificatesIssued: asCount(raw.certificatesIssued, base.certificatesIssued),
    pendingProgramHolders: asCount(raw.pendingProgramHolders, base.pendingProgramHolders),
    pendingDocuments: asCount(raw.pendingDocuments, base.pendingDocuments),
  };
}

/** Guarantee a complete dashboard payload so render never throws on undefined sections. */
export function normalizeAdminDashboardData(
  input: Partial<AdminDashboardData> | null | undefined,
): AdminDashboardData {
  const fallback = getDegradedAdminDashboardData();
  if (!input) return fallback;

  const pendingApplications = normalizeRecentApplications(
    input.pendingApplications as RecentApplication[] | undefined,
  );
  const recentApplications = normalizeRecentApplications(input.recentApplications);

  return {
    ...fallback,
    ...input,
    counts: normalizeCounts(input.counts, pendingApplications.length || recentApplications.length),
    revenueAllTimeCents: asCount(input.revenueAllTimeCents, fallback.revenueAllTimeCents),
    totalStudents: asCount(input.totalStudents, fallback.totalStudents),
    recentPayments: asObjectArray(input.recentPayments),
    operational: normalizeOperational(input.operational),
    priorities: normalizePriorities(input.priorities),
    kpis: normalizeKpis(input.kpis),
    enrollmentTrend: asObjectArray(input.enrollmentTrend),
    studentStatuses: asObjectArray(input.studentStatuses),
    topPrograms: normalizeTopPrograms(input.topPrograms),
    recentActivity: asObjectArray(input.recentActivity).map((item) => ({
      id: String(item.id ?? 'activity'),
      title: typeof item.title === 'string' ? item.title : 'Activity',
      timestamp:
        typeof item.timestamp === 'string' ? item.timestamp : new Date().toISOString(),
    })),
    recentStudents: normalizeRecentStudents(input.recentStudents),
    recentApplications,
    pendingApplications,
    blockedPrograms: asObjectArray(input.blockedPrograms),
    inactiveLearners: normalizeInactiveLearners(input.inactiveLearners),
    pendingSubmissions: asObjectArray(input.pendingSubmissions),
    complianceAlerts: asObjectArray(input.complianceAlerts),
    staleLeads: asObjectArray(input.staleLeads),
    pendingWioaDocs: asCount(input.pendingWioaDocs, fallback.pendingWioaDocs),
    stalledApplications: asObjectArray(input.stalledApplications),
    noOutcomeEnrollments: asObjectArray(input.noOutcomeEnrollments),
    missingFundingEnrollments: asObjectArray(input.missingFundingEnrollments),
    profile: normalizeProfile(input.profile),
    generatedAt:
      typeof input.generatedAt === 'string' ? input.generatedAt : fallback.generatedAt,
    sitePreviewTargets: normalizeSitePreviewTargets(
      input.sitePreviewTargets,
      fallback.sitePreviewTargets,
    ),
    degradedSections: asArray(input.degradedSections).filter(
      (section): section is AdminDashboardData['degradedSections'][number] =>
        typeof section === 'string',
    ),
    systemHealth: normalizeSystemHealth(input.systemHealth),
    isSuperAdmin: input.isSuperAdmin === true || normalizeProfile(input.profile)?.role === 'super_admin',
  };
}
