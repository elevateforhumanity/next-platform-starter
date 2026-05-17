/**
 * Central System Registry
 *
 * Canonical per-program and per-system map. Single source of truth for:
 *   - program slugs → routes, APIs, DB tables, certificate templates
 *   - system → owned routes, APIs, tables, status
 *   - AI action → required permission tier
 *
 * Update this file when adding programs or systems.
 * The AI console reads this at runtime for structural reasoning.
 */

// ── Program Registry ─────────────────────────────────────────────────────────

export interface ProgramRegistryEntry {
  slug: string;
  title: string;
  category: 'healthcare' | 'trades' | 'apprenticeship' | 'business' | 'technology' | 'special';
  canonical_route: string;
  apply_route: string;
  checkout_route: string;
  enrollment_api: string;
  certificate_template: string | null;
  db_program_id?: string; // populated from live DB — optional
  has_dedicated_page: boolean; // true = app/programs/[slug]/page.tsx exists
  has_lms_course: boolean;
  status: 'active' | 'draft' | 'archived';
  funding: ('wioa' | 'ita' | 'self_pay' | 'employer' | 'jri' | 'grant')[];
}

export const PROGRAM_REGISTRY: ProgramRegistryEntry[] = [
  // ── Healthcare ──────────────────────────────────────────────────────────
  {
    slug: 'cna',
    title: 'CNA / Nursing Assistant',
    category: 'healthcare',
    canonical_route: '/programs/cna',
    apply_route: '/programs/cna/apply',
    checkout_route: '/checkout/cna',
    enrollment_api: '/api/enrollment/create',
    certificate_template: 'cna-completion-v1',
    has_dedicated_page: true,
    has_lms_course: true,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  {
    slug: 'qma',
    title: 'QMA / Medication Aide',
    category: 'healthcare',
    canonical_route: '/programs/qma',
    apply_route: '/programs/qma/apply',
    checkout_route: '/checkout/qma',
    enrollment_api: '/api/enrollment/create',
    certificate_template: 'qma-completion-v1',
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    category: 'healthcare',
    canonical_route: '/programs/medical-assistant',
    apply_route: '/programs/medical-assistant/apply',
    checkout_route: '/checkout/medical-assistant',
    enrollment_api: '/api/enrollment/create',
    certificate_template: 'ma-completion-v1',
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  {
    slug: 'peer-recovery-specialist',
    title: 'Peer Recovery Specialist',
    category: 'healthcare',
    canonical_route: '/programs/peer-recovery-specialist',
    apply_route: '/programs/peer-recovery-specialist/apply',
    checkout_route: '/checkout/peer-recovery-specialist',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'jri', 'self_pay'],
  },
  {
    slug: 'direct-support-professional',
    title: 'Direct Support Professional',
    category: 'healthcare',
    canonical_route: '/programs/direct-support-professional',
    apply_route: '/programs/direct-support-professional/apply',
    checkout_route: '/checkout/direct-support-professional',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'self_pay'],
  },
  {
    slug: 'drug-collector',
    title: 'Drug & Alcohol Collector',
    category: 'healthcare',
    canonical_route: '/programs/drug-collector',
    apply_route: '/programs/drug-collector/apply',
    checkout_route: '/checkout/drug-collector',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['self_pay', 'employer'],
  },
  {
    slug: 'cpr-first-aid',
    title: 'CPR / First Aid',
    category: 'healthcare',
    canonical_route: '/programs/cpr-first-aid',
    apply_route: '/programs/cpr-first-aid/apply',
    checkout_route: '/checkout/cpr-first-aid',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['self_pay', 'employer'],
  },
  {
    slug: 'pharmacy-technician',
    title: 'Pharmacy Technician',
    category: 'healthcare',
    canonical_route: '/programs/pharmacy-technician',
    apply_route: '/programs/pharmacy-technician/apply',
    checkout_route: '/checkout/pharmacy-technician',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  {
    slug: 'phlebotomy',
    title: 'Phlebotomy',
    category: 'healthcare',
    canonical_route: '/programs/phlebotomy',
    apply_route: '/programs/phlebotomy/apply',
    checkout_route: '/checkout/phlebotomy',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  // ── Skilled Trades ──────────────────────────────────────────────────────
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    category: 'trades',
    canonical_route: '/programs/hvac-technician',
    apply_route: '/programs/hvac-technician/apply',
    checkout_route: '/checkout/hvac-technician',
    enrollment_api: '/api/enrollment/create',
    certificate_template: 'hvac-epa608-v1',
    has_dedicated_page: true,
    has_lms_course: true,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay', 'employer'],
  },
  {
    slug: 'building-services-technician',
    title: 'Building Services Technician',
    category: 'trades',
    canonical_route: '/programs/building-services-technician',
    apply_route: '/programs/building-services-technician/apply',
    checkout_route: '/checkout/building-services-technician',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'self_pay'],
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    category: 'trades',
    canonical_route: '/programs/electrical',
    apply_route: '/programs/electrical/apply',
    checkout_route: '/checkout/electrical',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  {
    slug: 'plumbing',
    title: 'Plumbing',
    category: 'trades',
    canonical_route: '/programs/plumbing',
    apply_route: '/programs/plumbing/apply',
    checkout_route: '/checkout/plumbing',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    category: 'trades',
    canonical_route: '/programs/cdl-training',
    apply_route: '/programs/cdl-training/apply',
    checkout_route: '/checkout/cdl-training',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay', 'employer'],
  },
  // ── Apprenticeships ─────────────────────────────────────────────────────
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    category: 'apprenticeship',
    canonical_route: '/programs/barber-apprenticeship',
    apply_route: '/programs/barber-apprenticeship/apply',
    checkout_route: '/checkout/barber-apprenticeship',
    enrollment_api: '/api/enrollment/create',
    certificate_template: 'barber-apprenticeship-v1',
    has_dedicated_page: true,
    has_lms_course: true,
    status: 'active',
    funding: ['wioa', 'employer', 'self_pay'],
  },
  {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology Apprenticeship',
    category: 'apprenticeship',
    canonical_route: '/programs/cosmetology-apprenticeship',
    apply_route: '/programs/cosmetology-apprenticeship/apply',
    checkout_route: '/checkout/cosmetology-apprenticeship',
    enrollment_api: '/api/enrollment/create',
    certificate_template: 'cosmetology-apprenticeship-v1',
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'employer', 'self_pay'],
  },
  {
    slug: 'esthetician-apprenticeship',
    title: 'Esthetician Apprenticeship',
    category: 'apprenticeship',
    canonical_route: '/programs/esthetician-apprenticeship',
    apply_route: '/programs/esthetician-apprenticeship/apply',
    checkout_route: '/checkout/esthetician-apprenticeship',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'employer', 'self_pay'],
  },
  {
    slug: 'nail-technician-apprenticeship',
    title: 'Nail Technician Apprenticeship',
    category: 'apprenticeship',
    canonical_route: '/programs/nail-technician-apprenticeship',
    apply_route: '/programs/nail-technician-apprenticeship/apply',
    checkout_route: '/checkout/nail-technician-apprenticeship',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'employer', 'self_pay'],
  },
  // ── Business & Finance ──────────────────────────────────────────────────
  {
    slug: 'finance-bookkeeping-accounting',
    title: 'Finance, Bookkeeping & Accounting',
    category: 'business',
    canonical_route: '/programs/finance-bookkeeping-accounting',
    apply_route: '/programs/finance-bookkeeping-accounting/apply',
    checkout_route: '/checkout/finance-bookkeeping-accounting',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: true,
    has_lms_course: false,
    status: 'active',
    funding: ['wioa', 'ita', 'self_pay'],
  },
  // ── Special Programs ────────────────────────────────────────────────────
  {
    slug: 'jri',
    title: 'Justice-Involved Reentry Initiative',
    category: 'special',
    canonical_route: '/programs/jri',
    apply_route: '/programs/jri/apply',
    checkout_route: '/checkout/jri',
    enrollment_api: '/api/enrollment/create',
    certificate_template: null,
    has_dedicated_page: false,
    has_lms_course: false,
    status: 'active',
    funding: ['jri', 'grant', 'wioa'],
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getProgramBySlug(slug: string): ProgramRegistryEntry | undefined {
  return PROGRAM_REGISTRY.find(p => p.slug === slug);
}

export function getProgramsByCategory(category: ProgramRegistryEntry['category']): ProgramRegistryEntry[] {
  return PROGRAM_REGISTRY.filter(p => p.category === category);
}

export function getActivePrograms(): ProgramRegistryEntry[] {
  return PROGRAM_REGISTRY.filter(p => p.status === 'active');
}

// ── AI Permission Tiers ──────────────────────────────────────────────────────
// Controls what the AI operator is allowed to do without human approval.

export type AiPermissionTier =
  | 'read'        // read-only queries, no side effects
  | 'operator'    // operational actions: send emails, flag at-risk, run reports
  | 'developer'   // code/data actions: scan routes, query DB, inspect links
  | 'deployer'    // deployment actions: trigger builds, apply migrations
  | 'super';      // destructive actions: delete data, force-rollback

export interface AiToolPermission {
  tool: string;
  tier: AiPermissionTier;
  requires_confirmation: boolean;
  affects_production: boolean;
  description: string;
}

export const AI_TOOL_PERMISSIONS: AiToolPermission[] = [
  // Read tier — no side effects
  { tool: 'get_analytics',           tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Read analytics data' },
  { tool: 'list_applications',       tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List applications' },
  { tool: 'list_students',           tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List students' },
  { tool: 'list_enrollments',        tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List enrollments' },
  { tool: 'list_programs',           tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List programs' },
  { tool: 'list_cohorts',            tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List cohorts' },
  { tool: 'list_wioa',               tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List WIOA cases' },
  { tool: 'list_at_risk',            tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List at-risk learners' },
  { tool: 'list_completions',        tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List completions' },
  { tool: 'list_users',              tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List users' },
  { tool: 'list_payout_queue',       tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List payout queue' },
  { tool: 'list_shops',              tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List partner shops' },
  { tool: 'run_report',              tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Run operational report' },
  { tool: 'check_system_health',     tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Check system health' },
  { tool: 'check_monitoring',        tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Check monitoring status' },
  { tool: 'get_platform_state',      tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Get live platform state' },
  { tool: 'lookup_knowledge_graph',  tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Look up knowledge graph' },
  { tool: 'recall_memory',           tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Recall operational memory' },
  { tool: 'list_pending_migrations', tier: 'read',     requires_confirmation: false, affects_production: false, description: 'List migration files' },
  { tool: 'ask_question',            tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Answer a question' },
  { tool: 'repo_commits',            tier: 'read',     requires_confirmation: false, affects_production: false, description: 'View git commits' },
  { tool: 'export_catalog',          tier: 'read',     requires_confirmation: false, affects_production: false, description: 'Export program catalog' },
  // Developer tier — code/data inspection
  { tool: 'scan_routes',             tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Scan Next.js routes' },
  { tool: 'query_database',          tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Query Supabase DB (read-only)' },
  { tool: 'audit_system',            tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Run system audit' },
  { tool: 'inspect_links',           tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Inspect broken links' },
  { tool: 'audit_enrollment_pipeline', tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Audit enrollment pipeline' },
  { tool: 'verify_program_integrity', tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Verify program data integrity' },
  { tool: 'inspect_student_access',  tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Inspect student access' },
  { tool: 'smoke_test',              tier: 'developer', requires_confirmation: false, affects_production: false, description: 'Run smoke tests' },
  // Operator tier — side effects but non-destructive
  { tool: 'send_reminder',           tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Send reminder email' },
  { tool: 'send_email',              tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Send email' },
  { tool: 'send_bulk_email',         tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Send bulk email' },
  { tool: 'send_test_email',         tier: 'operator', requires_confirmation: false, affects_production: false, description: 'Send test email' },
  { tool: 'flag_at_risk',            tier: 'operator', requires_confirmation: false, affects_production: true,  description: 'Flag student at-risk' },
  { tool: 'approve_application',     tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Approve application' },
  { tool: 'enroll_student',          tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Enroll student' },
  { tool: 'save_memory',             tier: 'operator', requires_confirmation: false, affects_production: false, description: 'Save operational memory' },
  { tool: 'send_document_for_sign',  tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Send document for signature' },
  { tool: 'mark_payout_paid',        tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Mark payout paid' },
  { tool: 'update_user_role',        tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Update user role' },
  { tool: 'issue_certificate',       tier: 'operator', requires_confirmation: true,  affects_production: true,  description: 'Issue certificate' },
  // Deployer tier — affects production systems
  { tool: 'run_migration',           tier: 'deployer', requires_confirmation: true,  affects_production: true,  description: 'Apply DB migration' },
  { tool: 'deploy_autopilot',        tier: 'deployer', requires_confirmation: true,  affects_production: true,  description: 'Trigger deployment' },
  { tool: 'build_courses',           tier: 'deployer', requires_confirmation: true,  affects_production: true,  description: 'Build course content' },
  { tool: 'run_tests',               tier: 'deployer', requires_confirmation: false, affects_production: false, description: 'Run test suite' },
  { tool: 'run_backup',              tier: 'deployer', requires_confirmation: false, affects_production: false, description: 'Trigger backup' },
  { tool: 'run_automation',          tier: 'deployer', requires_confirmation: true,  affects_production: true,  description: 'Run automation workflow' },
  { tool: 'generate_course',         tier: 'deployer', requires_confirmation: true,  affects_production: true,  description: 'Generate course content' },
];

export function getToolPermission(tool: string): AiToolPermission | undefined {
  return AI_TOOL_PERMISSIONS.find(p => p.tool === tool);
}

export function getToolsByTier(tier: AiPermissionTier): AiToolPermission[] {
  return AI_TOOL_PERMISSIONS.filter(p => p.tier === tier);
}

export function requiresConfirmation(tool: string): boolean {
  return getToolPermission(tool)?.requires_confirmation ?? false;
}

// ── System Registry summary for AI context ───────────────────────────────────

export function getSystemRegistryContext(): string {
  const active = getActivePrograms();
  const byCategory = {
    healthcare: active.filter(p => p.category === 'healthcare'),
    trades: active.filter(p => p.category === 'trades'),
    apprenticeship: active.filter(p => p.category === 'apprenticeship'),
    business: active.filter(p => p.category === 'business'),
    special: active.filter(p => p.category === 'special'),
  };

  const lines = [
    '=== PROGRAM REGISTRY ===',
    `Total active programs: ${active.length}`,
    '',
    ...Object.entries(byCategory).map(([cat, progs]) =>
      `${cat.toUpperCase()} (${progs.length}):\n${progs.map(p =>
        `  ${p.slug} → ${p.canonical_route} | apply: ${p.apply_route} | funding: ${p.funding.join(', ')}`
      ).join('\n')}`
    ),
    '',
    '=== AI PERMISSION TIERS ===',
    'read: query-only, no side effects',
    'developer: code/data inspection, no writes',
    'operator: emails, flags, approvals (requires confirmation for production writes)',
    'deployer: migrations, deployments, builds (always requires confirmation)',
    'super: destructive operations (not available via AI console)',
  ];

  return lines.join('\n');
}
