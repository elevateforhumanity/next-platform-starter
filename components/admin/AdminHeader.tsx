'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EnvironmentBadge from './EnvironmentBadge';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Rocket,
  Menu,
  X,
  ChevronDown,
  GitBranch,
  RefreshCw,
  DollarSign,
  HeadphonesIcon,
  Video,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'People',
    icon: Users,
    items: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Students', href: '/admin/students' },
      { name: 'Staff', href: '/admin/staff' },
      { name: 'Instructors', href: '/admin/instructors' },
      { name: 'Instructor Performance', href: '/admin/instructors/performance' },
      { name: 'Applicants', href: '/admin/applicants' },
      { name: 'Leads', href: '/admin/leads' },
      { name: 'Contacts', href: '/admin/contacts' },
      { name: 'Waitlist', href: '/admin/waitlist' },
      { name: 'Delegates', href: '/admin/delegates' },
      { name: 'Impersonate User', href: '/admin/impersonate' },
      { name: 'At-Risk Learners', href: '/admin/at-risk' },
      { name: 'Barriers', href: '/admin/barriers' },
      { name: 'Activity Log', href: '/admin/activity' },
      { name: 'Notifications', href: '/admin/notifications' },
      { name: 'Inbox', href: '/admin/inbox' },
    ],
  },
  {
    name: 'Programs',
    icon: GraduationCap,
    items: [
      { name: 'All Programs', href: '/admin/programs' },
      { name: 'Program Builder', href: '/admin/programs/builder' },
      { name: 'Courses', href: '/admin/courses' },
      { name: 'Career Courses', href: '/admin/career-courses' },
      { name: 'Course Builder', href: '/admin/course-builder/generate' },
      { name: 'Modules', href: '/admin/modules' },
      { name: 'Quizzes', href: '/admin/quizzes' },
      { name: 'Curriculum Upload', href: '/admin/curriculum/upload' },
      { name: 'Enrollments', href: '/admin/enrollments' },
      { name: 'Enrollment Overview', href: '/admin/enrollment' },
      { name: 'Enrollment Jobs', href: '/admin/enrollment-jobs' },
      { name: 'Partner Enrollments', href: '/admin/partner-enrollments' },
      { name: 'Completions', href: '/admin/completions' },
      { name: 'Progress', href: '/admin/progress' },
      { name: 'Transfer Hours', href: '/admin/transfer-hours' },
      { name: 'Certificates', href: '/admin/certificates' },
      { name: 'Verifications', href: '/admin/verifications' },
      { name: 'Exam Authorizations', href: '/admin/exam-authorizations' },
      { name: 'Gradebook', href: '/admin/gradebook' },
      { name: 'Apprenticeships', href: '/admin/apprenticeships' },
      { name: 'Learning Paths', href: '/admin/learning-paths' },
      { name: 'External Courses', href: '/admin/external-courses' },
      { name: 'External Completions', href: '/admin/external-course-completions' },
      { name: 'External Module Approvals', href: '/admin/external-modules/approvals' },
      { name: 'Proctor Portal', href: '/admin/proctor-portal' },
      { name: 'LMS Dashboard', href: '/admin/lms-dashboard' },
    ],
  },
  {
    name: 'Partners',
    icon: Building2,
    items: [
      { name: 'All Partners', href: '/admin/partners' },
      { name: 'Employers', href: '/admin/employers' },
      { name: 'Program Holders', href: '/admin/program-holders' },
      { name: 'Program Holder Docs', href: '/admin/program-holder-documents' },
      { name: 'Acknowledgements', href: '/admin/program-holder-acknowledgements' },
      { name: 'MOUs', href: '/admin/mou' },
      { name: 'Providers', href: '/admin/providers' },
      { name: 'Shops', href: '/admin/shops' },
      { name: 'Referrals', href: '/admin/referrals' },
      { name: 'JRI', href: '/admin/jri' },
      { name: 'Affiliates', href: '/admin/affiliates' },
      { name: 'Tenants', href: '/admin/tenants' },
    ],
  },
  {
    name: 'Finance',
    icon: DollarSign,
    items: [
      { name: 'Payout Queue', href: '/admin/payout-queue' },
      { name: 'Funding Verification', href: '/admin/funding-verification' },
      { name: 'Funding Allocations', href: '/admin/funding/allocations' },
      { name: 'Grants — Apply', href: '/admin/grants/apply' },
      { name: 'Grants — Submissions', href: '/admin/grants/submissions' },
      { name: 'Grants — Revenue', href: '/admin/grants/revenue' },
      { name: 'Promo Codes', href: '/admin/promo-codes' },
      { name: 'Hours Export', href: '/admin/hours-export' },
      { name: 'Store Catalog', href: '/admin/store/catalog' },
      { name: 'Marketplace', href: '/admin/marketplace' },
      { name: 'Marketplace Creators', href: '/admin/marketplace/creators' },
      { name: 'Marketplace Payouts', href: '/admin/marketplace/payouts' },
      { name: 'License', href: '/admin/license' },
    ],
  },
  {
    name: 'Compliance',
    icon: Shield,
    items: [
      { name: 'Compliance', href: '/admin/compliance' },
      { name: 'Compliance Agreements', href: '/admin/compliance/agreements' },
      { name: 'FERPA — Access Requests', href: '/admin/ferpa/access-requests' },
      { name: 'FERPA — Audit Log', href: '/admin/ferpa/audit-log' },
      { name: 'FERPA — Consent Forms', href: '/admin/ferpa/consent-forms' },
      { name: 'FERPA — Directory Info', href: '/admin/ferpa/directory-info' },
      { name: 'FERPA — Training', href: '/admin/ferpa/training' },
      { name: 'Accreditation', href: '/admin/accreditation' },
      { name: 'Accreditation Report', href: '/admin/accreditation/report' },
      { name: 'CMI', href: '/admin/cmi' },
      { name: 'WIOA IEP', href: '/admin/wioa/iep' },
      { name: 'Outcomes', href: '/admin/outcomes' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'ETPL Dashboard', href: '/admin/dashboard/etpl' },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    items: [
      { name: 'Analytics', href: '/admin/analytics' },
      { name: 'Engagement', href: '/admin/analytics/engagement' },
      { name: 'Learning', href: '/admin/analytics/learning' },
      { name: 'Programs', href: '/admin/analytics/programs' },
      { name: 'Revenue', href: '/admin/analytics/revenue' },
      { name: 'Employers', href: '/admin/analytics/employers' },
      { name: 'Enrollment Report', href: '/admin/reports/enrollment' },
      { name: 'Financial Report', href: '/admin/reports/financial' },
      { name: 'Leads Report', href: '/admin/reports/leads' },
      { name: 'Partners Report', href: '/admin/reports/partners' },
      { name: 'Users Report', href: '/admin/reports/users' },
      { name: 'Caseload Report', href: '/admin/reports/caseload' },
      { name: 'Charts', href: '/admin/reports/charts' },
      { name: 'Next Steps', href: '/admin/next-steps' },
    ],
  },
  {
    name: 'Content',
    icon: FileText,
    items: [
      { name: 'Documents', href: '/admin/documents' },
      { name: 'Document Review', href: '/admin/documents/review' },
      { name: 'Files', href: '/admin/files' },
      { name: 'Blog', href: '/admin/blog' },
      { name: 'Marketing', href: '/admin/marketing' },
      { name: 'Email Automation', href: '/admin/email-marketing/automation' },
      { name: 'Announcements', href: '/admin/announcements' },
      { name: 'Editor', href: '/admin/editor' },
      { name: 'Data Import', href: '/admin/data-import' },
      { name: 'Migrations', href: '/admin/migrations' },
    ],
  },
  {
    name: 'Media',
    icon: Video,
    items: [
      { name: 'Video Manager', href: '/admin/video-manager' },
      { name: 'Video Generator', href: '/admin/video-generator' },
      { name: 'Media Library', href: '/admin/videos' },
    ],
  },
  {
    name: 'Support',
    icon: HeadphonesIcon,
    items: [
      { name: 'Submissions', href: '/admin/submissions' },
      { name: 'Review Queue', href: '/admin/review-queue' },
      { name: 'Applications', href: '/admin/applications' },
      { name: 'Barber Shop Applications', href: '/admin/barber-shop-applications' },
      { name: 'Campaigns', href: '/admin/campaigns' },
      { name: 'CRM', href: '/admin/crm' },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    items: [
      { name: 'Settings', href: '/admin/settings' },
      { name: 'API Keys', href: '/admin/api-keys' },
      { name: 'System Health', href: '/admin/system-health' },
      { name: 'System Jobs', href: '/admin/system/jobs' },
      { name: 'Webhooks', href: '/admin/system/webhooks' },
      { name: 'Monitoring', href: '/admin/monitoring/setup' },
      { name: 'Automation', href: '/admin/automation' },
      { name: 'Integrations', href: '/admin/integrations' },
      { name: 'Calendly', href: '/admin/integrations/calendly' },
      { name: 'Env Manager', href: '/admin/integrations/env-manager' },
      { name: 'Gemini AI', href: '/admin/integrations/gemini' },
      { name: 'QuickBooks', href: '/admin/integrations/quickbooks' },
      { name: 'Salesforce', href: '/admin/integrations/salesforce' },
      { name: 'Stripe', href: '/admin/integrations/stripe' },
      { name: 'Teams', href: '/admin/integrations/teams' },
      { name: 'Advanced Tools', href: '/admin/advanced-tools' },
      { name: 'Dev Studio', href: '/admin/dev-studio' },
      { name: 'AI Console', href: '/admin/ai-console' },
    ],
  },
];

// Environment detection for badge
const isProd = process.env.NODE_ENV === 'production';
const isPreview = false;

function getEnvBadge(): { label: string; color: string } {
  if (isProd) {
    return {
      label: 'PRODUCTION',
      color: 'bg-brand-red-100 text-brand-red-800 border-brand-red-200',
    };
  }
  if (isPreview) {
    return { label: 'PREVIEW', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  }
  return {
    label: 'DEVELOPMENT',
    color: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200',
  };
}

export default function AdminHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const envBadge = getEnvBadge();

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const response = await fetch('/api/autopilots/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'both' }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        alert(data.message ?? 'Deployment triggered. Check GitHub Actions for status.');
      } else {
        alert(data.error ?? 'Failed to trigger deployment');
      }
    } catch {
      alert('Error triggering deployment');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-[9999] shadow-lg">
      <div className="h-full flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-brand-blue-400" />
          <span className="font-bold text-lg hidden sm:block">Admin Panel</span>
        </Link>

        {/* Environment Badge */}
        <EnvironmentBadge label={envBadge.label} color={envBadge.color} />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Admin navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.name} className="relative">
              {section.href ? (
                <Link
                  href={section.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === section.href
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.name}
                </Link>
              ) : (
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === section.name ? null : section.name)
                  }
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    section.items?.some((item) => pathname.startsWith(item.href))
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.name}
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}

              {/* Dropdown */}
              {section.items && openDropdown === section.name && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`block px-4 py-2 text-sm ${
                        pathname === item.href
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Deploy Button */}
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-brand-green-800 rounded-md text-sm font-medium transition-colors"
          >
            {deploying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/elevateforhumanity/Elevate-lms"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            GitHub
          </a>

          {/* Back to Site */}
          <Link
            href="/"
            className="hidden sm:block px-3 py-1.5 text-slate-300 hover:text-white text-sm"
          >
            View Site
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-slate-900 border-t border-slate-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.name}>
                {section.href ? (
                  <Link
                    href={section.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800"
                  >
                    <section.icon className="w-5 h-5" />
                    {section.name}
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 text-slate-400 font-medium">
                      <section.icon className="w-5 h-5" />
                      {section.name}
                    </div>
                    <div className="ml-7 space-y-1">
                      {section.items?.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Mobile Deploy */}
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-green-600 hover:bg-brand-green-700 rounded-md text-sm font-medium mt-4"
            >
              {deploying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {deploying ? 'Deploying...' : 'Deploy to Production'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
