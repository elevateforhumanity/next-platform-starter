'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, Bell, LogOut, Search, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LogoImage from '@/components/site/LogoImage';

export interface AdminNavNotif {
  id: string;
  title: string;
  time: string;
  href: string;
  unread: boolean;
}

interface AdminNavProps {
  userName?: string;
  notifs?: AdminNavNotif[];
}

const NAV = [
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
      { label: 'Monitoring', href: '/admin/monitoring' },
      { label: 'Monitoring Setup', href: '/admin/monitoring/setup' },
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'System Jobs', href: '/admin/system/jobs' },
      { label: 'System Webhooks', href: '/admin/system/webhooks' },
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
      { label: 'Completions', href: '/admin/completions' },
      { label: 'Outcomes', href: '/admin/outcomes' },
      { label: 'Progress', href: '/admin/progress' },
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
      { label: 'FERPA', href: '/admin/ferpa' },
      { label: 'FERPA Training', href: '/admin/ferpa/training' },
      { label: 'Impersonate', href: '/admin/impersonate' },
    ],
  },
  {
    label: 'Programs',
    href: '/admin/programs',
    items: [
      // ── Primary creation workflow ──────────────────────────────────────────
      { label: 'All Programs', href: '/admin/programs' },
      { label: 'Create Program', href: '/admin/programs/new' },
      { label: 'Program Builder', href: '/admin/programs/builder' },
      { label: 'Programs — Catalog', href: '/admin/programs/catalog' },
      // ── Curriculum ────────────────────────────────────────────────────────
      { label: 'Curriculum', href: '/admin/curriculum' },
      { label: 'Curriculum Upload', href: '/admin/curriculum/upload' },
      { label: 'Modules', href: '/admin/modules' },

      // ── Courses (operational) ─────────────────────────────────────────────
      { label: 'Courses', href: '/admin/courses' },
      { label: 'Courses — Create', href: '/admin/courses/create' },
      { label: 'Courses — Manage', href: '/admin/courses/manage' },
      { label: 'Courses — Bulk Ops', href: '/admin/courses/bulk-operations' },
      { label: 'Courses — Partners', href: '/admin/courses/partners' },
      // ── Credentials & delivery ────────────────────────────────────────────
      { label: 'Certifications — Bulk', href: '/admin/certifications/bulk' },
      { label: 'Credentials', href: '/admin/credentials' },
      { label: 'Quizzes', href: '/admin/quizzes' },
      { label: 'Proctor Portal', href: '/admin/proctor-portal' },
      // ── Instructors & cohorts ─────────────────────────────────────────────
      { label: 'Instructors', href: '/admin/instructors' },
      { label: 'Instructors — Performance', href: '/admin/instructors/performance' },
      { label: 'Cohorts', href: '/admin/cohorts' },
      { label: 'Apprenticeships', href: '/admin/apprenticeships' },
      { label: 'Apprenticeships — Link', href: '/admin/apprenticeships/link-accounts' },
      { label: 'Career Courses', href: '/admin/career-courses' },
      // ── External & compliance ─────────────────────────────────────────────
      { label: 'External Courses', href: '/admin/external-courses' },
      { label: 'External Modules', href: '/admin/external-modules' },
      { label: 'External Modules — Approvals', href: '/admin/external-modules/approvals' },
      { label: 'External Progress', href: '/admin/external-progress' },
      { label: 'External Completions', href: '/admin/external-course-completions' },
      { label: 'ETPL Dashboard', href: '/admin/dashboard/etpl' },
    ],
  },
  {
    // "Build" is now scoped to non-curriculum production tools only.
    // Curriculum creation lives under Programs → Program Builder.
    label: 'Build',
    href: '/admin/course-builder',
    items: [
      { label: 'Blueprint Builder', href: '/admin/course-builder' },
      { label: 'Assessment Bank', href: '/admin/course-builder/assessments' },
      { label: 'Media Library', href: '/admin/course-builder/media' },
      { label: 'Course Templates', href: '/admin/course-builder/templates' },
      { label: 'Template Records', href: '/admin/course-templates' },
      { label: 'Course Import', href: '/admin/course-import' },

      { label: 'Media Studio', href: '/admin/media-studio' },
      { label: 'Video Manager', href: '/admin/video-manager' },
      { label: 'Video Generator', href: '/admin/video-generator' },
      { label: 'Videos', href: '/admin/videos' },
      { label: 'Videos — Upload', href: '/admin/videos/upload' },
    ],
  },
  {
    label: 'AI',
    href: '/admin/ai-console',
    items: [
      { label: 'AI Console', href: '/admin/ai-console' },
      { label: 'Copilot', href: '/admin/copilot' },
      { label: 'Copilot — Deploy', href: '/admin/copilot/deploy' },
      { label: 'Automation', href: '/admin/automation' },
      { label: 'Workflows', href: '/admin/workflows' },
      { label: 'Dev Studio', href: '/admin/dev-studio' },
    ],
  },
  {
    label: 'Funding',
    href: '/admin/funding',
    items: [
      { label: 'Funding', href: '/admin/funding' },
      { label: 'Grants', href: '/admin/grants' },
      { label: 'Grants — Apply', href: '/admin/grants/apply' },
      { label: 'Grants — Intake', href: '/admin/grants/intake' },
      { label: 'Grants — Revenue', href: '/admin/grants/revenue' },

      { label: 'Grants — Submissions', href: '/admin/grants/submissions' },
      { label: 'Grants — Workflow', href: '/admin/grants/workflow' },
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
      { label: 'Payroll', href: '/admin/payroll' },
      { label: 'Payroll Cards', href: '/admin/payroll-cards' },

      { label: 'Tax Filing', href: '/admin/tax-filing' },
      { label: 'Tax Filing — Applications', href: '/admin/tax-filing/applications' },
      { label: 'Tax Filing — Reports', href: '/admin/tax-filing/reports' },
      { label: 'Tax Filing — Preparers', href: '/admin/tax-filing/preparers' },
      { label: 'Tax Filing — Training', href: '/admin/tax-filing/training' },
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
    href: '/admin/marketing',
    items: [
      { label: 'Marketing', href: '/admin/marketing' },
      { label: 'CRM', href: '/admin/crm' },
      { label: 'CRM — Appointments', href: '/admin/crm/appointments' },
      { label: 'CRM — Campaigns', href: '/admin/crm/campaigns' },
      { label: 'CRM — Contacts', href: '/admin/crm/contacts' },
      { label: 'CRM — Deals', href: '/admin/crm/deals' },
      { label: 'CRM — Follow-Ups', href: '/admin/crm/follow-ups' },
      { label: 'CRM — Leads', href: '/admin/crm/leads' },
      { label: 'Campaigns', href: '/admin/campaigns' },
      { label: 'Email Marketing', href: '/admin/email-marketing' },
      { label: 'Email Marketing — Analytics', href: '/admin/email-marketing/analytics' },
      { label: 'Email Marketing — Automation', href: '/admin/email-marketing/automation' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Social Media', href: '/admin/social-media' },
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
      { label: 'Compliance — Agreements', href: '/admin/compliance/agreements' },
      { label: 'Compliance — Deletions', href: '/admin/compliance/deletions' },
      { label: 'Compliance — Exports', href: '/admin/compliance/exports' },
      { label: 'Compliance — Financial Assurance', href: '/admin/compliance/financial-assurance' },
      { label: 'Compliance Audit', href: '/admin/compliance-audit' },
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
      {
        label: 'Governance — Operational Controls',
        href: '/admin/governance/operational-controls',
      },
      { label: 'Audit Logs', href: '/admin/audit-logs' },
      { label: 'Documents', href: '/admin/documents' },
      { label: 'Documents — Review', href: '/admin/documents/review' },
      { label: 'Documents — Templates', href: '/admin/documents/templates' },
      { label: 'Documents — Upload', href: '/admin/documents/upload' },
      { label: 'Document Center', href: '/admin/document-center' },
      { label: 'Signatures', href: '/admin/signatures' },
      { label: 'MOU', href: '/admin/mou' },
      { label: 'MOU Docs', href: '/admin/docs/mou' },
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
      { label: 'Users', href: '/admin/users' },
      { label: 'Tenants', href: '/admin/tenants' },
      { label: 'License', href: '/admin/license' },
      { label: 'Licenses', href: '/admin/licenses' },
      { label: 'Licensing', href: '/admin/licensing' },
      { label: 'License Requests', href: '/admin/license-requests' },

      { label: 'API Keys', href: '/admin/api-keys' },
      { label: 'Integrations', href: '/admin/integrations' },
      { label: 'Integrations — Stripe', href: '/admin/integrations/stripe' },
      { label: 'Integrations — Env Manager', href: '/admin/integrations/env-manager' },
      { label: 'Integrations — Google Classroom', href: '/admin/integrations/google-classroom' },
      { label: 'Integrations — Salesforce', href: '/admin/integrations/salesforce' },
      { label: 'Migrations', href: '/admin/migrations' },
      { label: 'Import', href: '/admin/import' },

      { label: 'Files', href: '/admin/files' },
      { label: 'Docs', href: '/admin/docs' },
      { label: 'Internal Docs', href: '/admin/internal-docs' },
      { label: 'Advanced Tools', href: '/admin/advanced-tools' },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin/dashboard') return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

function isSectionActive(pathname: string, section: (typeof NAV)[0]) {
  return section.items.some((item) => isActive(pathname, item.href));
}

export default function AdminNav({ userName = 'Admin', notifs = [] }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => n.unread).length;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setNotifOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/admin/students?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-full flex items-center gap-2 px-4 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-4">
            <LogoImage alt="Elevate" width={28} height={42} className="w-auto h-8" />
            <span className="font-bold text-slate-900 text-sm hidden sm:block">
              Elevate <span className="text-brand-red-600 font-semibold">Admin</span>
            </span>
          </Link>

          <nav
            ref={navRef}
            aria-label="Admin navigation"
            className="hidden lg:flex items-center gap-0 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {NAV.map((section) => {
              const active = isSectionActive(pathname, section);
              const open = openDropdown === section.label;
              return (
                <div key={section.label} className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenDropdown(open ? null : section.label)}
                    className={`flex items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    {section.label}
                    <ChevronDown
                      className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-[75vh] overflow-y-auto">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-4 py-2 text-sm transition-colors ${isActive(pathname, item.href) ? 'bg-brand-red-50 text-brand-red-700 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-slate-400 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-28 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </form>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red-500 ring-2 ring-white" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <Link
                      href="/admin/notifications"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        All caught up
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                            >
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">{n.time}</p>
                          </div>
                          {n.unread && (
                            <span className="mt-2 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-1 pl-3 border-l border-slate-200">
              <Link
                href="/admin/settings"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <span className="text-sm text-slate-700 px-1 hidden xl:block">{userName}</span>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className="fixed top-16 right-0 bottom-0 w-[85vw] max-w-sm bg-white border-l border-slate-200 z-50 lg:hidden transform transition-transform duration-300 overflow-y-auto shadow-2xl"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="p-4 space-y-1">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-4"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </form>

          {/* Quick-access shortcuts */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Dashboard', href: '/admin/dashboard' },
              { label: 'Students', href: '/admin/students' },
              { label: 'Enrollments', href: '/admin/enrollments' },
              { label: 'Applications', href: '/admin/applications' },
              { label: 'Compliance', href: '/admin/compliance' },
              { label: 'Reports', href: '/admin/reports' },
              { label: 'Programs', href: '/admin/programs' },
              { label: 'CRM', href: '/admin/crm/leads' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-center ${
                  isActive(pathname, item.href)
                    ? 'bg-brand-red-50 text-brand-red-700'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 mb-2">All Sections</p>

          {NAV.map((section) => {
            const active = isSectionActive(pathname, section);
            const expanded = mobileExpanded === section.label;
            return (
              <div
                key={section.label}
                className="border-b border-slate-200 pb-1 mb-1 last:border-0"
              >
                <button
                  onClick={() => setMobileExpanded(expanded ? null : section.label)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-colors ${active ? 'text-brand-red-700 bg-brand-red-50' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {section.label}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {expanded && (
                  <div className="ml-3 mt-1 mb-2 space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-3 py-2 rounded-xl text-sm transition-colors ${isActive(pathname, item.href) ? 'bg-brand-red-50 text-brand-red-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 space-y-2 border-t border-slate-200">
            <Link
              href="/admin/settings"
              className="block px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
