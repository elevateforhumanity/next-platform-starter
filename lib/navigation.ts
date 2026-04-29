// Single source of truth for the public marketing site navigation.
//
// Rules:
// - 7 top-level items only. No portals in top nav — portals are post-login.
// - Programs mega menu: 3 industry groups, one canonical entry per program.
// - Apprenticeships: separate from programs — DOL-registered, distinct system.
// - Testing: infrastructure, not a sub-item of programs.
// - Funding: overview + named streams + single eligibility CTA.
// - Partners: 3 roles — employers, agencies, training providers.
// - Apply: single funnel entry point (no dropdown).
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
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'Certified Nursing Assistant (CNA)', href: canonicalRoutes.programs.certifiedNursingAssistant },
      { name: 'Qualified Medication Aide (QMA)', href: '/programs/healthcare' },
      { name: 'Phlebotomy', href: '/programs/phlebotomy' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: 'All Healthcare →', href: '/programs/healthcare' },
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'CDL (Class A / B)', href: '/programs/cdl-training' },
      { name: 'Welding', href: '/programs/welding' },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'Construction Trades', href: '/programs/construction-trades-certification' },
      { name: 'All Trades →', href: '/programs/skilled-trades' },
      { name: '— Technology & Business —', href: '/programs/technology', isHeader: true },
      { name: 'IT Support', href: '/programs/it-support' },
      { name: 'Cybersecurity', href: '/programs/cybersecurity' },
      { name: 'Office Administration', href: '/programs/office-administration' },
      { name: 'Entrepreneurship', href: '/programs/entrepreneurship' },
      { name: 'All Programs →', href: '/programs' },
    ],
  },

  // ── 2. Apprenticeships ───────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: '/apprenticeships',
    subItems: [
      { name: '— DOL Registered —', href: '/apprenticeships', isHeader: true },
      { name: 'Barbering', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Esthetics / Nail Tech', href: '/programs/esthetician' },
      { name: 'Culinary Arts', href: '/programs/culinary-apprenticeship' },
      { name: '— Become a Host —', href: '/partners/barbershop-apprenticeship', isHeader: true },
      { name: 'Barbershop Partner', href: '/partners/barbershop-apprenticeship' },
      { name: 'Salon / Cosmetology Partner', href: '/partners/cosmetology-apprenticeship' },
    ],
  },

  // ── 3. Certifications ────────────────────────────────────────────────────────
  {
    id: 'certifications',
    name: 'Certifications',
    href: '/certifications',
    subItems: [
      { name: '— Short-Duration Credentials —', href: '/certifications', isHeader: true },
      { name: 'HVAC Certification', href: canonicalRoutes.programs.hvacTechnician },
      { name: 'CPR / First Aid', href: canonicalRoutes.programs.cprFirstAid },
      { name: 'OSHA / Emergency Health & Safety', href: '/programs/emergency-health-safety' },
      { name: 'Sanitation & Infection Control', href: '/programs/sanitation-infection-control' },
    ],
  },

  // ── 4. Testing ───────────────────────────────────────────────────────────────
  {
    id: 'testing',
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Certification Exams —', href: '/testing', isHeader: true },
      { name: 'NHA Healthcare Exams', href: '/testing' },
      { name: 'EPA 608 (HVAC)', href: '/testing' },
      { name: 'Certiport — Microsoft / Adobe', href: '/testing' },
      { name: 'WorkKeys / NCRC', href: '/testing' },
      { name: '— Schedule & Verify —', href: '/testing', isHeader: true },
      { name: 'Book a Testing Session', href: '/testing/book' },
      { name: 'Verify a Credential', href: '/verify' },
    ],
  },

  // ── 5. Funding ───────────────────────────────────────────────────────────────
  {
    id: 'funding',
    name: 'Funding',
    href: '/funding',
    subItems: [
      { name: '— Funding Streams —', href: '/funding', isHeader: true },
      { name: 'WIOA / WorkOne', href: '/funding/wioa' },
      { name: 'Workforce Ready Grant (WRG)', href: '/funding/wrg' },
      { name: 'FSSA IMPACT (SNAP / TANF)', href: '/fssa' },
      { name: 'Job Ready Indy', href: '/jri' },
      { name: '— Options —', href: '/funding', isHeader: true },
      { name: 'Self-Pay & Payment Plans', href: '/financing' },
      { name: 'OJT & Wage Reimbursement', href: '/ojt-and-funding' },
      { name: 'Check Eligibility →', href: '/check-eligibility' },
    ],
  },

  // ── 6. Partners ──────────────────────────────────────────────────────────────
  {
    id: 'partners',
    name: 'Partners',
    href: '/partners',
    subItems: [
      { name: '— Employers —', href: '/for-employers', isHeader: true },
      { name: 'Hire Our Graduates', href: '/for-employers' },
      { name: 'Post a Job / OJT', href: '/ojt-and-funding' },
      { name: '— Workforce Agencies —', href: '/for-agencies', isHeader: true },
      { name: 'WIOA / WorkOne Referrals', href: '/for-agencies' },
      { name: 'FSSA / SNAP E&T', href: '/snap-et-partner' },
      { name: '— Training Providers —', href: '/training-providers', isHeader: true },
      { name: 'Become a Provider', href: '/training-providers' },
      { name: 'Apply as a Provider', href: '/partners/apply' },
    ],
  },

  // ── 7. Apply — single funnel entry, no dropdown ──────────────────────────────
  {
    id: 'apply',
    name: 'Apply',
    href: '/apply',
  },
];
