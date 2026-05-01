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
  // Mega-menu: every canonical program, grouped by industry.
  // Rules: use canonicalRoutes paths only — no redirect stubs.
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      // Healthcare
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'Certified Nursing Assistant (CNA)', href: canonicalRoutes.programs.certifiedNursingAssistant },
      { name: 'Qualified Medication Aide (QMA)', href: canonicalRoutes.programs.qualifiedMedicationAide },
      { name: 'Medical Assistant', href: canonicalRoutes.programs.medicalAssistant },
      { name: 'Phlebotomy', href: canonicalRoutes.programs.phlebotomy },
      { name: 'Pharmacy Technician', href: canonicalRoutes.programs.pharmacyTechnician },
      { name: 'Home Health Aide', href: canonicalRoutes.programs.homeHealthAide },
      { name: 'Peer Recovery Specialist', href: canonicalRoutes.programs.peerRecoverySpecialist },
      { name: 'Direct Support Professional', href: canonicalRoutes.programs.directSupportProfessional },
      { name: 'Drug & Alcohol Specimen Collector', href: '/programs/drug-collector' },
      { name: 'All Healthcare →', href: '/programs/healthcare', isSectionLink: true },

      // Skilled Trades
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
      { name: 'CDL (Class A / B)', href: canonicalRoutes.programs.cdlTraining },
      { name: 'Welding', href: canonicalRoutes.programs.welding },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'Construction Trades', href: canonicalRoutes.programs.constructionTrades },
      { name: 'Building Services Technician', href: canonicalRoutes.programs.buildingServicesTechnician },
      { name: 'Diesel Mechanic', href: canonicalRoutes.programs.dieselMechanic },
      { name: 'Forklift Operator', href: canonicalRoutes.programs.forklift },
      { name: 'All Trades →', href: '/programs/skilled-trades', isSectionLink: true },

      // Technology & Business
      { name: '— Technology & Business —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: canonicalRoutes.programs.itHelpDesk },
      { name: 'Cybersecurity Analyst', href: canonicalRoutes.programs.cybersecurityAnalyst },
      { name: 'Network Administration', href: canonicalRoutes.programs.networkAdministration },
      { name: 'Network Support Technician', href: '/programs/network-support-technician' },
      { name: 'Web Development', href: canonicalRoutes.programs.webDevelopment },
      { name: 'Software Development', href: canonicalRoutes.programs.softwareDevelopment },
      { name: 'Graphic Design', href: canonicalRoutes.programs.graphicDesign },
      { name: 'CAD / Drafting', href: canonicalRoutes.programs.cadDrafting },
      { name: 'Business Administration', href: canonicalRoutes.programs.businessAdministration },
      { name: 'Office Administration', href: canonicalRoutes.programs.officeAdministration },
      { name: 'Bookkeeping', href: canonicalRoutes.programs.bookkeeping },
      { name: 'Finance & Accounting Pathway', href: '/programs/finance-bookkeeping-accounting' },
      { name: 'Tax Preparation', href: canonicalRoutes.programs.taxPreparation },
      { name: 'Entrepreneurship', href: canonicalRoutes.programs.entrepreneurship },
      { name: 'Project Management', href: canonicalRoutes.programs.projectManagement },
      { name: 'All Programs →', href: '/programs', isSectionLink: true },

      // Hubs & Special Programs
      { name: '— Hubs & Special Programs —', href: '/programs', isHeader: true },
      { name: 'Beauty Programs Hub', href: '/programs/beauty' },
      { name: 'Business Programs Hub', href: '/programs/business' },
      { name: 'Federal-Funded Programs', href: '/programs/federal-funded' },
      { name: 'Micro-Credentials', href: '/programs/micro-programs' },
      { name: 'JRI — Justice-Involved', href: '/programs/jri' },
    ],
  },

  // ── 2. Apprenticeships ───────────────────────────────────────────────────────
  {
    id: 'apprenticeships',
    name: 'Apprenticeships',
    href: '/apprenticeships',
    subItems: [
      { name: '— DOL Registered —', href: '/apprenticeships', isHeader: true },
      { name: 'All Apprenticeships', href: '/programs/apprenticeships' },
      { name: 'Barbering', href: canonicalRoutes.programs.barberApprenticeship },
      { name: 'Cosmetology', href: canonicalRoutes.programs.cosmetologyApprenticeship },
      { name: 'Esthetics Apprenticeship', href: canonicalRoutes.programs.estheticianApprenticeship },
      { name: 'Esthetician License', href: '/programs/esthetician' },
      { name: 'Nail Technology', href: canonicalRoutes.programs.nailTechnicianApprenticeship },
      { name: 'Beauty Career Educator', href: canonicalRoutes.programs.beautyCareerEducator },
      { name: 'Culinary Arts', href: canonicalRoutes.programs.culinaryApprenticeship },
      { name: 'Hospitality', href: canonicalRoutes.programs.hospitality },
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
      { name: 'CPR / First Aid', href: canonicalRoutes.programs.cprFirstAid },
      { name: 'OSHA / Emergency Health & Safety', href: canonicalRoutes.programs.osha },
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

  // ── 8. Impact ────────────────────────────────────────────────────────────────
  {
    id: 'impact',
    name: 'Our Impact',
    href: '/impact',
  },

  // ── 9. Donate ────────────────────────────────────────────────────────────────
  {
    id: 'donate',
    name: 'Donate',
    href: '/donate',
  },
];
