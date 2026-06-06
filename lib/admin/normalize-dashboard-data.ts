import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import type {
  AdminDashboardData,
  DashboardCounts,
  KPICard,
  OperationalCounts,
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

  const pendingApplications = asArray(input.pendingApplications);
  const recentApplications = asArray(input.recentApplications);

  return {
    ...fallback,
    ...input,
    counts: normalizeCounts(input.counts, pendingApplications.length || recentApplications.length),
    revenueAllTimeCents: asCount(input.revenueAllTimeCents, fallback.revenueAllTimeCents),
    totalStudents: asCount(input.totalStudents, fallback.totalStudents),
    recentPayments: asArray(input.recentPayments),
    operational: normalizeOperational(input.operational),
    priorities: normalizePriorities(input.priorities),
    kpis: normalizeKpis(input.kpis),
    enrollmentTrend: asArray(input.enrollmentTrend),
    studentStatuses: asArray(input.studentStatuses),
    topPrograms: asArray(input.topPrograms),
    recentActivity: asArray(input.recentActivity),
    recentStudents: asArray(input.recentStudents),
    recentApplications,
    pendingApplications,
    blockedPrograms: asArray(input.blockedPrograms),
    inactiveLearners: asArray(input.inactiveLearners),
    pendingSubmissions: asArray(input.pendingSubmissions),
    complianceAlerts: asArray(input.complianceAlerts),
    staleLeads: asArray(input.staleLeads),
    pendingWioaDocs: asCount(input.pendingWioaDocs, fallback.pendingWioaDocs),
    stalledApplications: asArray(input.stalledApplications),
    noOutcomeEnrollments: asArray(input.noOutcomeEnrollments),
    missingFundingEnrollments: asArray(input.missingFundingEnrollments),
    profile: input.profile ?? fallback.profile,
    generatedAt: input.generatedAt ?? fallback.generatedAt,
    sitePreviewTargets: asArray(input.sitePreviewTargets).length
      ? asArray(input.sitePreviewTargets)
      : fallback.sitePreviewTargets,
    degradedSections: asArray(input.degradedSections),
    systemHealth: normalizeSystemHealth(input.systemHealth),
    isSuperAdmin: input.isSuperAdmin === true,
  };
}
