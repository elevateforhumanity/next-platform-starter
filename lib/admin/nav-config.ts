/**
 * Admin navigation configuration.
 *
 * Canonical source: `platform_settings` row with key `ADMIN_NAV_SECTIONS_JSON`.
 * If that row is absent or invalid, the hardcoded DEFAULT_NAV is used.
 *
 * Shape stored in DB (JSON array):
 *   [{ label: string; href: string; items: { label: string; href: string }[] }]
 *
 * To customise nav without a deploy:
 *   UPDATE platform_settings SET value = '<json>' WHERE key = 'ADMIN_NAV_SECTIONS_JSON';
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  label: string;
  href: string;
  items: NavItem[];
}

export const DEFAULT_NAV: NavSection[] = [
  {
    label: 'Operations',
    href: '/admin/dashboard',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Activity Feed', href: '/admin/activity' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Analytics — Engagement', href: '/admin/analytics/engagement' },
      { label: 'Analytics — Learning', href: '/admin/analytics/learning' },
      { label: 'Analytics — Programs', href: '/admin/analytics/programs' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Reports — Enrollment', href: '/admin/reports/enrollment' },
      { label: 'Reports — Financial', href: '/admin/reports/financial' },
      { label: 'Reports — Leads', href: '/admin/reports/leads' },
      { label: 'Reports — Partners', href: '/admin/reports/partners' },
      { label: 'Reports — Users', href: '/admin/reports/users' },
      { label: 'Reports — Caseload', href: '/admin/reports/caseload' },
      { label: 'Reports — Charts', href: '/admin/reports/charts' },
      { label: 'Reports — Samples', href: '/admin/reports/samples' },
      { label: 'At-Risk', href: '/admin/at-risk' },
      { label: 'Notifications', href: '/admin/notifications' },
      { label: 'Inbox', href: '/admin/inbox' },
    ],
  },
  {
    label: 'Students',
    href: '/admin/students',
    items: [
      { label: 'All Students', href: '/admin/students' },
      { label: 'Students Export', href: '/admin/students/export' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Enrollments', href: '/admin/enrollments' },
      { label: 'Enrollment Jobs', href: '/admin/enrollment-jobs' },
      { label: 'Gradebook', href: '/admin/gradebook' },
      { label: 'Submissions', href: '/admin/submissions' },
      { label: 'Submissions — Attachments', href: '/admin/submissions/attachments' },
      { label: 'Submissions — Compliance', href: '/admin/submissions/compliance' },
      { label: 'Submissions — Content', href: '/admin/submissions/content' },
      { label: 'Submissions — Exceptions', href: '/admin/submissions/exceptions' },
      { label: 'Submissions — Facts', href: '/admin/submissions/facts' },
      { label: 'Submissions — Opportunities', href: '/admin/submissions/opportunities' },
      { label: 'Submissions — Org', href: '/admin/submissions/org' },
      { label: 'Submissions — Partners', href: '/admin/submissions/partners' },
      { label: 'Submissions — Past Perf.', href: '/admin/submissions/past-performance' },
      { label: 'Submissions — Templates', href: '/admin/submissions/templates' },
      { label: 'Verifications', href: '/admin/verifications' },
      { label: 'Verifications Review', href: '/admin/verifications/review' },
      { label: 'Certificates', href: '/admin/certificates' },
      { label: 'Certificates — Bulk', href: '/admin/certificates/bulk' },
      { label: 'Certificates — Issue', href: '/admin/certificates/issue' },
      { label: 'Exam Authorizations', href: '/admin/exam-authorizations' },
      { label: 'Barriers', href: '/admin/barriers' },
      { label: 'Next Steps', href: '/admin/next-steps' },
      { label: 'Waitlist', href: '/admin/waitlist' },
      { label: 'Intake', href: '/admin/intake' },
      { label: 'Transfer Hours', href: '/admin/transfer-hours' },
      { label: 'WorkOne Queue', href: '/admin/workone-queue' },
      { label: 'Barber Shop Applications', href: '/admin/barber-shop-applications' },
      { label: 'Referrals', href: '/admin/referrals' },

    ],
  },
  {
    label: 'Programs',
    href: '/admin/programs',
    items: [
      { label: 'All Programs', href: '/admin/programs' },
      { label: 'Create Program', href: '/admin/programs/new' },
      { label: 'Program Builder', href: '/admin/course-builder' },
      { label: 'Programs — Catalog', href: '/admin/programs/catalog' },
      { label: 'Curriculum', href: '/admin/curriculum' },
      { label: 'Curriculum Upload', href: '/admin/curriculum/upload' },
      { label: 'Learning Paths', href: '/admin/learning-paths' },
      { label: 'CMI Dashboard', href: '/admin/cmi' },
      { label: 'Modules', href: '/admin/modules' },
      { label: 'Courses', href: '/admin/courses' },
      { label: 'Courses — Create', href: '/admin/courses/create' },
      { label: 'Courses — Bulk Ops', href: '/admin/courses/bulk-operations' },
      { label: 'Courses — Partners', href: '/admin/courses/partners' },

      { label: 'Credentials', href: '/admin/credentials' },
      { label: 'Quizzes', href: '/admin/quizzes' },
      { label: 'Proctor Portal', href: '/admin/proctor-portal' },
      { label: 'Instructors', href: '/admin/instructors' },
      { label: 'Instructors — Performance', href: '/admin/instructors/performance' },
      { label: 'Cohorts', href: '/admin/cohorts' },
      { label: 'Apprenticeships', href: '/admin/apprenticeships' },
      { label: 'Student OJT Hours', href: '/admin/student-hours' },
      { label: 'Apprenticeships — Link', href: '/admin/apprenticeships/link-accounts' },
      { label: 'Career Courses', href: '/admin/career-courses' },

      { label: 'External Modules', href: '/admin/external-modules' },
      { label: 'External Modules — Approvals', href: '/admin/external-modules/approvals' },
      { label: 'External Progress', href: '/admin/external-progress' },
      { label: 'External Completions', href: '/admin/external-course-completions' },
      { label: 'ETPL Dashboard', href: '/admin/dashboard/etpl' },
    ],
  },
  {
    label: 'Build',
    href: '/admin/course-builder',
    items: [
      { label: 'Blueprint Builder', href: '/admin/course-builder' },
      { label: 'Assessment Bank', href: '/admin/course-builder/assessments' },
      { label: 'Media Library', href: '/admin/course-builder/media' },
      { label: 'Course Templates', href: '/admin/course-builder/templates' },
      { label: 'Media Studio', href: '/admin/media-studio' },
      { label: 'Video Manager', href: '/admin/video-manager' },
      { label: 'Video Generator', href: '/admin/video-generator' },
      { label: 'Videos', href: '/admin/videos' },
      { label: 'Videos — Upload', href: '/admin/videos/upload' },
    ],
  },
  {
    label: 'AI',
    href: '/admin/ai-studio',
    items: [
      { label: 'AI Studio', href: '/admin/ai-studio' },
      { label: 'AI Console', href: '/admin/ai-console' },
      { label: 'Command Center', href: '/admin/command-center' },
      { label: 'Dev Studio', href: '/admin/dev-studio' },
      { label: 'Copilot', href: '/admin/copilot' },
      { label: 'Copilot — Deploy', href: '/admin/copilot/deploy' },
      { label: 'Automation', href: '/admin/automation' },
      { label: 'Workflows', href: '/admin/workflows' },
    ],
  },
  {
    label: 'Funding',
    href: '/admin/funding',
    items: [
      { label: 'Funding', href: '/admin/funding' },
      { label: 'Grant & Contract Suite', href: '/admin/compliance/automation' },
      { label: 'Grants', href: '/admin/grants' },
      { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
      { label: 'Grants — Opportunities', href: '/admin/grants/opportunities' },
      { label: 'Grants — Applications', href: '/admin/grants/applications' },
      { label: 'Grants — Intake', href: '/admin/grants/intake' },
      { label: 'Grants — Revenue', href: '/admin/grants/revenue' },
      { label: 'Grants — Submissions', href: '/admin/grants/submissions' },
      { label: 'Grants — Workflow', href: '/admin/grants/workflow' },
      { label: 'Contracts', href: '/admin/contracts' },
      { label: 'WIOA', href: '/admin/wioa' },
      { label: 'WIOA — Eligibility', href: '/admin/wioa/eligibility' },
      { label: 'WIOA — Documents', href: '/admin/wioa/documents' },
      { label: 'WIOA — Verify', href: '/admin/wioa/verify' },
      { label: 'JRI', href: '/admin/jri' },
      { label: 'JRI — Participants', href: '/admin/jri/participants' },
      { label: 'JRI — Reports', href: '/admin/jri/reports' },
      { label: 'Incentives', href: '/admin/incentives' },
      { label: 'Cash Advances', href: '/admin/cash-advances' },
      { label: 'Cash Advances — Pending', href: '/admin/cash-advances/pending' },
      { label: 'Cash Advances — Reports', href: '/admin/cash-advances/reports' },
      { label: 'Cash Advances — Settings', href: '/admin/cash-advances/settings' },
      { label: 'Payout Queue', href: '/admin/payout-queue' },
      { label: 'Payroll Cards', href: '/admin/payroll-cards' },

      { label: 'WOTC', href: '/admin/wotc' },
      { label: 'RAPIDS', href: '/admin/rapids' },
      { label: 'RAPIDS — Apprentices', href: '/admin/rapids/apprentices' },
      { label: 'Funding Verification', href: '/admin/funding-verification' },
      { label: 'Hours Export', href: '/admin/hours-export' },
    ],
  },
  {
    label: 'Partners',
    href: '/admin/employers',
    items: [
      { label: 'Employers', href: '/admin/employers' },
      { label: 'Employers — Onboarding', href: '/admin/employers/onboarding' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Partners — LMS Integrations', href: '/admin/partners/lms-integrations' },
      { label: 'Partner Enrollments', href: '/admin/partner-enrollments' },
      { label: 'Partner Inquiries', href: '/admin/partner-inquiries' },
      { label: 'Jobs', href: '/admin/jobs' },
      { label: 'Affiliates', href: '/admin/affiliates' },
      { label: 'Marketplace', href: '/admin/marketplace' },
      { label: 'Marketplace — Creators', href: '/admin/marketplace/creators' },
      { label: 'Marketplace — Payouts', href: '/admin/marketplace/payouts' },
      { label: 'Marketplace — Products', href: '/admin/marketplace/products' },
      { label: 'Providers', href: '/admin/providers' },
      { label: 'Provider Applications', href: '/admin/provider-applications' },
      { label: 'Program Holders', href: '/admin/program-holders' },
      { label: 'Program Holders — Verification', href: '/admin/program-holders/verification' },
      { label: 'Program Holder Acknowledgements', href: '/admin/program-holder-acknowledgements' },
      { label: 'Program Holder Documents', href: '/admin/program-holder-documents' },
      { label: 'Delegates', href: '/admin/delegates' },
      { label: 'Shops', href: '/admin/shops' },
      { label: 'Shops — Geocoding', href: '/admin/shops/geocoding' },
    ],
  },
  {
    label: 'Marketing',
    href: '/admin/crm',
    items: [
      { label: 'CRM', href: '/admin/crm' },
      { label: 'CRM — Appointments', href: '/admin/crm/appointments' },
      { label: 'CRM — Campaigns', href: '/admin/crm/campaigns' },
      { label: 'CRM — Contacts', href: '/admin/crm/contacts' },
      { label: 'CRM — Deals', href: '/admin/crm/deals' },
      { label: 'CRM — Follow-Ups', href: '/admin/crm/follow-ups' },
      { label: 'CRM — Leads', href: '/admin/crm/leads' },
      { label: 'Email Marketing', href: '/admin/email-marketing' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Promo Codes', href: '/admin/promo-codes' },
      { label: 'Store', href: '/admin/store' },
      { label: 'Store — Catalog', href: '/admin/store/catalog' },
      { label: 'Store — Clones', href: '/admin/store/clones' },
      { label: 'Live Chat', href: '/admin/live-chat' },
    ],
  },
  {
    label: 'Compliance',
    href: '/admin/compliance',
    items: [
      { label: 'Compliance', href: '/admin/compliance' },
      { label: 'Compliance — Automation Suite', href: '/admin/compliance/automation' },
      { label: 'Compliance — Agreements', href: '/admin/compliance/agreements' },
      { label: 'Compliance — Deletions', href: '/admin/compliance/deletions' },
      { label: 'Compliance — Exports', href: '/admin/compliance/exports' },
      { label: 'Compliance — Financial Assurance', href: '/admin/compliance/financial-assurance' },

      { label: 'Accreditation', href: '/admin/accreditation' },
      { label: 'Accreditation Report', href: '/admin/accreditation/report' },
      { label: 'Governance', href: '/admin/governance' },
      { label: 'Governance — Auth. Docs', href: '/admin/governance/authoritative-docs' },
      { label: 'Governance — Compliance', href: '/admin/governance/compliance' },
      { label: 'Governance — Data', href: '/admin/governance/data' },
      { label: 'Governance — Legal', href: '/admin/governance/legal' },
      { label: 'Governance — Security', href: '/admin/governance/security' },
      { label: 'Governance — SEO Indexing', href: '/admin/governance/seo-indexing' },
      { label: 'Governance — Contact', href: '/admin/governance/contact' },
      { label: 'Governance — Operational Controls', href: '/admin/governance/operational-controls' },
      { label: 'FERPA', href: '/admin/ferpa' },
      { label: 'FERPA Training', href: '/admin/ferpa/training' },
      { label: 'Audit Logs', href: '/admin/audit-logs' },
      { label: 'Documents', href: '/admin/documents' },
      { label: 'Documents — Upload', href: '/admin/documents/upload' },
      { label: 'Documents — Review', href: '/admin/documents/review' },
      { label: 'Documents — Templates', href: '/admin/documents/templates' },
      { label: 'Signatures', href: '/admin/signatures' },
      { label: 'MOU', href: '/admin/mou' },
      { label: 'MOU Docs', href: '/admin/docs/mou' },
      { label: 'Org Profile', href: '/admin/settings/organization-profile' },
      { label: 'HR', href: '/admin/hr' },
      { label: 'HR — Employees', href: '/admin/hr/employees' },
      { label: 'HR — Leave', href: '/admin/hr/leave' },
      { label: 'HR — Payroll', href: '/admin/hr/payroll' },
      { label: 'HR — Time', href: '/admin/hr/time' },
      { label: 'Review Queue', href: '/admin/review-queue' },
    ],
  },
  {
    label: 'System',
    href: '/admin/settings',
    items: [
      { label: 'Settings', href: '/admin/settings' },
      { label: 'Users', href: '/admin/staff' },
      { label: 'Tenants', href: '/admin/tenants' },
      { label: 'Licenses', href: '/admin/licenses' },
      { label: 'Licensing', href: '/admin/licensing' },
      { label: 'API Keys', href: '/admin/api-keys' },
      { label: 'Integrations', href: '/admin/integrations' },
      { label: 'Integrations — Stripe', href: '/admin/integrations/stripe' },
      { label: 'Integrations — Env Manager', href: '/admin/integrations/env-manager' },
      { label: 'Integrations — Google Classroom', href: '/admin/integrations/google-classroom' },
      { label: 'Integrations — Salesforce', href: '/admin/integrations/salesforce' },
      { label: 'Migrations', href: '/admin/migrations' },
      { label: 'Import', href: '/admin/import' },
      { label: 'Data Import', href: '/admin/data-import' },
      { label: 'System', href: '/admin/system' },
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'System Jobs', href: '/admin/system/jobs' },
      { label: 'System Webhooks', href: '/admin/system/webhooks' },
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'Monitoring Setup', href: '/admin/monitoring/setup' },
      { label: 'Impersonate', href: '/admin/impersonate' },
      { label: 'Files', href: '/admin/files' },
      { label: 'Docs', href: '/admin/docs' },
      { label: 'Internal Docs', href: '/admin/internal-docs' },
      { label: 'Advanced Tools', href: '/admin/advanced-tools' },
      { label: 'Navigation Settings', href: '/admin/settings/nav' },
    ],
  },
];

/**
 * Validate that a parsed value matches NavSection[].
 * Rejects anything that could inject arbitrary hrefs.
 */
export function isNavSections(v: unknown): v is NavSection[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(
    (s) =>
      s &&
      typeof s === 'object' &&
      typeof s.label === 'string' &&
      typeof s.href === 'string' &&
      s.href.startsWith('/admin') &&
      Array.isArray(s.items) &&
      s.items.every(
        (i: unknown) =>
          i &&
          typeof i === 'object' &&
          typeof (i as NavItem).label === 'string' &&
          typeof (i as NavItem).href === 'string' &&
          (i as NavItem).href.startsWith('/admin'),
      ),
  );
}
