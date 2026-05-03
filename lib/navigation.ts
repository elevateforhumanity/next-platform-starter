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
      { name: '— Special Programs —', href: '/programs', isHeader: true },
      { name: 'Federal-Funded Programs', href: '/programs/federal-funded' },
      { name: 'JRI — Justice-Involved', href: '/programs/jri' },
      { name: 'All Programs →', href: '/programs', isSectionLink: true },
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
      { name: '— Booth Rental —', href: '/booth-rental', isHeader: true },
      { name: 'Booth Rental Program', href: '/booth-rental' },
      { name: 'Apply for Booth Rental', href: '/booth-rental/apply' },
      { name: '— Become a Host Shop —', href: '/partners/barbershop-apprenticeship', isHeader: true },
      { name: 'Barbershop Partner', href: '/partners/barbershop-apprenticeship' },
      { name: 'Salon / Cosmetology Partner', href: '/partners/cosmetology-apprenticeship' },
      { name: 'Esthetician Partner', href: '/partners/esthetician-apprenticeship' },
      { name: 'Nail Tech Partner', href: '/partners/nail-technician-apprenticeship' },
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
      { name: '— Testing & Verification —', href: '/testing', isHeader: true },
      { name: 'NHA Healthcare Exams', href: '/testing' },
      { name: 'EPA 608 (HVAC)', href: '/testing' },
      { name: 'Certiport — Microsoft / Adobe', href: '/testing' },
      { name: 'WorkKeys / NCRC', href: '/testing' },
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
      { name: 'Employer Hub', href: '/employers' },
      { name: 'Post a Job / OJT', href: '/employers/post-job' },
      { name: 'Talent Pipeline', href: '/employers/talent-pipeline' },
      { name: 'Apprenticeship Sponsorship', href: '/employers/apprenticeships' },
      { name: 'Employer Benefits', href: '/employers/benefits' },
      // Workforce Agencies
      { name: '— Workforce Agencies —', href: '/for-agencies', isHeader: true },
      { name: 'WIOA / WorkOne Referrals', href: '/for-agencies' },
      { name: 'FSSA / SNAP E&T', href: '/snap-et-partner' },
      { name: 'Apprenticeship Sponsor', href: '/apprenticeship-sponsor' },
      { name: 'Workforce Boards', href: '/platform/workforce-boards' },
      // Training Providers & Program Holders
      { name: '— Training Providers & Program Holders —', href: '/training-providers', isHeader: true },
      { name: 'Become a Provider', href: '/training-providers' },
      { name: 'Program Holders', href: '/platform/program-holders' },
      { name: 'Platform for Providers', href: '/platform/providers' },
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
];
