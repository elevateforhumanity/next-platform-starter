// Single source of truth for the public marketing site navigation.
//
// Rules:
// - Top-level items cover every major audience and content area.
// - Programs mega-menu: all canonical programs, grouped by industry.
// - Apprenticeships: DOL-registered, separate from programs.
// - Partners: employers, agencies, training providers, program holders, booth renters.
// - About: mission, team, impact, blog, contact, advising.
// - Funding: all streams + eligibility CTA.
// - Apply: single funnel entry point.
//
// Consumed by:
//   components/site/Header.tsx → HeaderDesktopNav + HeaderMobileMenu

import { canonicalRoutes } from '@/lib/routes/canonical-routes';

export interface NavSubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  nested?: boolean;
}

export interface NavItem {
  id: string;
  name: string;
  href?: string;
  subItems?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  // ── 1. Programs ─────────────────────────────────────────────────────────────
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      // Healthcare
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'CNA / Nursing Assistant', href: '/programs/cna' },
      { name: 'QMA / Medication Aide', href: '/programs/qma' },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: 'Direct Support Professional', href: canonicalRoutes.programs.directSupportProfessional },
      { name: 'Drug & Alcohol Collector', href: '/programs/drug-collector' },
      { name: 'CPR / First Aid', href: '/programs/cpr-first-aid' },
      { name: 'All Healthcare →', href: '/programs/healthcare', isSectionLink: true },

      // Skilled Trades
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
      { name: 'Building Services Technician', href: canonicalRoutes.programs.buildingServicesTechnician },
      { name: 'All Trades →', href: '/programs/skilled-trades', isSectionLink: true },

      // Beauty & Personal Services
      { name: '— Beauty & Personal Services —', href: '/programs/apprenticeships', isHeader: true },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },

      // Business & Finance
      { name: '— Business & Finance —', href: '/programs/finance-bookkeeping-accounting', isHeader: true },
      { name: 'Finance, Bookkeeping & Accounting', href: '/programs/finance-bookkeeping-accounting' },

      // Special Programs
      { name: '— Special Programs —', href: '/programs', isHeader: true },
      { name: 'Federal-Funded Programs', href: '/programs/federal-funded' },
      { name: 'JRI — Justice-Involved', href: '/partners/jri' },
      { name: 'All Programs →', href: '/programs', isSectionLink: true },
    ],
  },

  // ── 2. Apprenticeships ───────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: '/programs/apprenticeships',
    subItems: [
      { name: '— DOL Registered —', href: '/programs/apprenticeships', isHeader: true },
      { name: 'All Apprenticeships', href: '/programs/apprenticeships' },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: '— Become a Host Shop —', href: '/partners/barbershop-apprenticeship', isHeader: true },
      { name: 'Barbershop Partner', href: '/partners/barbershop-apprenticeship' },
      { name: 'Cosmetology Shop Owner', href: '/partners/cosmetology-apprenticeship' },
      { name: 'Esthetician Partner', href: '/partners/esthetician-apprenticeship' },
    ],
  },

  // ── 3. Certifications ────────────────────────────────────────────────────────
  {
    id: 'certifications',
    name: 'Certifications',
    href: '/certificates',
    subItems: [
      { name: '— Testing & Verification —', href: '/testing', isHeader: true },
      { name: 'NHA Healthcare Exams', href: '/testing' },
      { name: 'EPA 608 (HVAC)', href: '/testing' },
      { name: 'Book a Testing Session', href: '/testing/book' },
      { name: 'Verify a Credential', href: '/verify' },
    ],
  },

  // ── 4. Funding ───────────────────────────────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    href: '/funding',
    subItems: [
      { name: '— Funding Streams —', href: '/funding', isHeader: true },
      { name: 'WIOA / WorkOne', href: '/funding/wioa' },
      { name: 'Workforce Ready Grant (WRG)', href: '/funding/wrg' },
      { name: 'FSSA IMPACT (SNAP / TANF)', href: '/fssa' },
      { name: 'FSSA Impact Program', href: '/fssa-impact' },
      { name: 'Job Ready Indy (JRI)', href: '/jri' },
      { name: 'Grant Programs', href: '/funding/grant-programs' },
      { name: 'Federal Programs', href: '/funding/federal-programs' },
      { name: '— Payment Options —', href: '/financing', isHeader: true },
      { name: 'Self-Pay & Payment Plans', href: '/financing' },
      { name: 'OJT & Wage Reimbursement', href: '/ojt-and-funding' },
      { name: 'Scholarships', href: '/scholarships' },
      { name: 'Check Eligibility →', href: '/check-eligibility', isSectionLink: true },
    ],
  },

  // ── 5. Partners ──────────────────────────────────────────────────────────────
  {
    id: 'partners',
    name: 'Partners',
    href: '/partners',
    subItems: [
      // Employers
      { name: '— Employers —', href: '/for-employers', isHeader: true },
      { name: 'Hire Our Graduates', href: '/for-employers' },
      { name: 'Employer Hub', href: '/employer/dashboard' },
      { name: 'Post a Job / OJT', href: '/employer/post-job' },
      { name: 'Talent Pipeline', href: '/employer/dashboard' },
      { name: 'Apprenticeship Sponsorship', href: '/employer/apprenticeships' },
      { name: 'Employer Benefits', href: '/employer/dashboard' },
      // Workforce Agencies
      { name: '— Workforce Agencies —', href: '/for-agencies', isHeader: true },
      { name: 'WIOA / WorkOne Referrals', href: '/for-agencies' },
      { name: 'FSSA / SNAP E&T', href: '/snap-et-partner' },
      { name: 'Apprenticeship Sponsor', href: '/apprenticeship-sponsor' },
      { name: 'Workforce Boards', href: '/platform/workforce-boards' },
      { name: 'Cosmetology Shop Owner', href: '/partners/cosmetology-apprenticeship' },
      // Training Providers & Program Holders
      { name: '— Training Providers —', href: '/for-providers', isHeader: true },
      { name: 'Run a Program with Us', href: '/for-providers' },
      { name: 'Sponsors & Funders', href: '/platform/sponsors' },
      { name: 'Apply as a Partner →', href: '/partners/apply', isSectionLink: true },
    ],
  },

  // ── 6. About ─────────────────────────────────────────────────────────────────
  {
    id: 'about',
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'Our Mission', href: '/about/mission' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Our Partners', href: '/about/partners' },
      { name: 'Impact & Outcomes', href: '/impact' },
      { name: 'Live Metrics', href: '/metrics' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: '— Resources —', href: '/blog', isHeader: true },
      { name: 'Blog', href: '/blog' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Events', href: '/events' },
      { name: 'Success Stories', href: '/success-stories' },
      { name: 'Press', href: '/press' },
      { name: '— Contact —', href: '/contact', isHeader: true },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Free Advising', href: '/advising' },
      { name: 'Schedule a Consultation', href: '/schedule-consultation' },
      { name: 'Schedule a Meeting', href: '/schedule' },
      { name: 'Donate', href: '/donate' },
    ],
  },

  // ── 7. Apply — single funnel entry, no dropdown ──────────────────────────────
  {
    id: 'apply',
    name: 'Apply',
    href: '/apply',
  },

  // ── 8. My Learning — authenticated learner portal links ─────────────────────
  // Admin links are intentionally excluded from the public nav. Admin users
  // access admin.elevateforhumanity.org directly via their own bookmark/login.
  {
    id: 'dashboard',
    name: 'My Learning',
    href: '/lms',
    subItems: [
      { name: 'My Courses', href: '/lms/courses' },
      { name: 'My Programs', href: '/lms/programs' },
      { name: 'My Progress', href: '/lms/dashboard' },
      { name: 'My Certificates', href: '/lms/certificates' },
      { name: 'My Profile', href: '/lms/profile' },
    ],
  },
];
