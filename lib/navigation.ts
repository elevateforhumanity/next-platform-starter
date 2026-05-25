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
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'CDL Training', href: '/programs/cdl-training' },
      { name: 'All Trades →', href: '/programs/skilled-trades', isSectionLink: true },

      // Beauty & Cosmetology
      { name: '— Beauty & Cosmetology —', href: '/programs/beauty', isHeader: true },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'All Beauty →', href: '/apprenticeships', isSectionLink: true },

      // Technology
      { name: '— Technology —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
      { name: 'All Technology →', href: '/programs/technology', isSectionLink: true },

      // Business & Finance
      { name: '— Business & Finance —', href: '/programs/finance-bookkeeping-accounting', isHeader: true },
      { name: 'Finance, Bookkeeping & Accounting', href: '/programs/finance-bookkeeping-accounting' },

      // Short Courses (partner)
      { name: '— Short Courses —', href: '/courses', isHeader: true },
      { name: 'CPR / First Aid (HSI)', href: '/partners/hsi' },
      { name: 'Food Handler (NRF)', href: '/partners/nrf' },
      { name: 'All Short Courses →', href: '/courses', isSectionLink: true },

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
    href: '/apprenticeships',
    subItems: [
      // DOL Registered programs
      { name: '— DOL Registered —', href: '/apprenticeships', isHeader: true },
      { name: 'All Apprenticeships', href: '/apprenticeships' },
      { name: 'Barber Apprenticeship', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology Apprenticeship', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetician Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Skilled Trades Apprenticeships', href: '/programs/skilled-trades' },
      // Host a site
      { name: '— Host a Site —', href: '/partners/barbershop-apprenticeship', isHeader: true },
      { name: 'Host a Barbershop Apprenticeship', href: '/partners/barbershop-apprenticeship' },
      { name: 'Host a Cosmetology Apprenticeship', href: '/partners/cosmetology-apprenticeship' },
      { name: 'Apprenticeship Sponsorship', href: '/employer/apprenticeships' },
      { name: 'How It Works →', href: '/apprenticeships', isSectionLink: true },
    ],
  },

  // ── 3. Testing ───────────────────────────────────────────────────────────────
  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
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
      { name: 'Post a Job / OJT', href: '/employer/post-job' },
      { name: 'Apprenticeship Sponsorship', href: '/employer/apprenticeships' },
      { name: 'Employer Portal →', href: '/employer/dashboard', isSectionLink: true },
      // Workforce Agencies
      { name: '— Workforce Agencies —', href: '/for-agencies', isHeader: true },
      { name: 'WIOA / WorkOne Referrals', href: '/for-agencies' },
      { name: 'FSSA / SNAP E&T', href: '/fssa' },
      { name: 'Apprenticeship Sponsor', href: '/apprenticeship-sponsor' },
      { name: 'Workforce Boards', href: '/platform/workforce-boards' },
      // Training Providers & Program Holders
      { name: '— Program Holders & Providers —', href: '/for-providers', isHeader: true },
      { name: 'How It Works', href: '/for-providers' },
      { name: 'Program Holder Portal', href: '/program-holder/dashboard' },
      { name: 'Sponsors & Funders', href: '/platform/sponsors' },
      { name: 'Apply to Partner →', href: '/partners/apply', isSectionLink: true },
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
];
