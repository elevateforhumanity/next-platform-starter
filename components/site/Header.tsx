// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';

// Marketing site navigation.
//
// Rule: this header is for first-time visitors — brand, mission, trust, outcomes,
// partners, and a single clear entry point into the LMS.
//
// Anything tied to studying, enrolling, accessing courses, or navigating programs
// belongs in the LMS navigation (components/lms/LMSNavigation.tsx), not here.
//
// Nav source: static config (intentional). The navigation_items DB table exists but
// has a schema too weak for mega-menu structure (no section, is_header, integer order).
// Nav changes require a deploy regardless — keeping it static avoids a DB round-trip
// on every page load with no editorial benefit. If a CMS-editable nav is needed,
// extend navigation_items with: section, is_header, display_order (int), parent_id.
export const NAV_ITEMS = [
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'CNA / Nursing Assistant', href: '/programs/cna' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: 'Pharmacy Technician', href: '/programs/pharmacy-technician' },
      { name: 'Phlebotomy', href: '/programs/phlebotomy' },
      { name: 'Sanitation & Infection Control', href: '/programs/sanitation-infection-control' },
      { name: 'Emergency Health & Safety', href: '/programs/emergency-health-safety' },
      { name: 'CPR / First Aid', href: '/programs/cpr-first-aid' },
      { name: 'Home Health Aide', href: '/programs/home-health-aide' },
      { name: 'All Healthcare Programs', href: '/programs/healthcare' },
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'HVAC Technician', href: '/programs/hvac-technician' },

      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Welding', href: '/programs/welding' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'Diesel Mechanic', href: '/programs/diesel-mechanic' },
      { name: 'Forklift Operator', href: '/programs/forklift' },
      { name: 'Construction Trades', href: '/programs/construction-trades-certification' },
      { name: 'All Trades Programs', href: '/programs/skilled-trades' },
      { name: '— Beauty & Barbering —', href: '/programs/apprenticeships', isHeader: true },
      { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship' },
      { name: 'Esthetician', href: '/programs/esthetician' },
      { name: 'Beauty Career Educator', href: '/programs/beauty-career-educator' },
      { name: 'Culinary Apprenticeship', href: '/programs/culinary-apprenticeship' },
      { name: '— Technology & Business —', href: '/programs/technology', isHeader: true },
      { name: 'IT Help Desk', href: '/programs/it-help-desk' },
      { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
      { name: 'Network Administration', href: '/programs/network-administration' },
      { name: 'Network Support Technician', href: '/programs/network-support-technician' },
      { name: 'Software Development', href: '/programs/software-development' },
      { name: 'Web Development', href: '/programs/web-development' },
      { name: 'Graphic Design', href: '/programs/graphic-design' },
      { name: 'CAD / Drafting', href: '/programs/cad-drafting' },
      { name: 'Tax Preparation', href: '/programs/tax-preparation' },
      { name: 'Bookkeeping', href: '/programs/bookkeeping' },
      { name: 'Business Administration', href: '/programs/business-administration' },
      { name: 'Finance & Accounting', href: '/programs/finance-bookkeeping-accounting' },
      { name: 'Project Management', href: '/programs/project-management' },
      { name: 'Office Administration', href: '/programs/office-administration' },
      { name: 'Entrepreneurship', href: '/programs/entrepreneurship' },
      { name: '— More Programs —', href: '/programs', isHeader: true },
      { name: 'Hospitality', href: '/programs/hospitality' },
      { name: 'All Programs →', href: '/programs' },
      { name: 'Certification Programs', href: '/training/certifications' },
      { name: '— Certification Testing —', href: '/testing', isHeader: true },
      { name: 'All Testing Providers', href: '/testing' },
      { name: 'NHA Healthcare Exams', href: '/testing' },
      { name: 'EPA 608 Certification', href: '/testing' },
      { name: 'Certiport (Microsoft, Adobe)', href: '/testing' },
      { name: 'Book a Testing Session', href: '/contact' },
      { name: 'Verify a Credential', href: '/verify' },
    ],
  },
  {
    name: 'Partners',
    href: '/partners',
    subItems: [
      {
        name: '— Apprenticeship Hosts —',
        href: '/partners/barbershop-apprenticeship',
        isHeader: true,
      },
      { name: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
      { name: 'Cosmetology & Salon Partners', href: '/partners/cosmetology-apprenticeship' },
      { name: 'Training Sites & Facilities', href: '/partners/training-sites' },
      { name: '— Workforce & Reentry —', href: '/agencies', isHeader: true },
      { name: 'For Workforce Agencies', href: '/agencies' },
      { name: 'SNAP E&T / IMPACT Partners', href: '/snap-et-partner' },
      { name: 'WorkOne / WIOA Referrals', href: '/partners/workforce' },
      { name: 'Reentry Organizations', href: '/partners/reentry' },
      { name: 'Job Ready Indy (JRI)', href: '/partners/jri' },
      { name: '— Employer & Staff Portals —', href: '/portals', isHeader: true },
      { name: 'Employer, Staff & Program Holder Portals', href: '/portals' },
      { name: '— Training Providers —', href: '/partners/training-provider', isHeader: true },
      { name: 'Training Providers', href: '/partners/training-provider' },
      { name: 'Apply as a Provider', href: '/partners/apply' },
      { name: '— Resources —', href: '/partners/join', isHeader: true },
      { name: 'Partner Overview', href: '/partners' },
      { name: 'Become a Partner', href: '/partners/join' },
      { name: 'WorkOne Partner Packet', href: '/workone-partner-packet' },
    ],
  },
  {
    name: 'Funding',
    href: '/funding',
    subItems: [
      { name: '— How Funding Works —', href: '/funding', isHeader: true },
      { name: 'Funding Overview', href: '/funding' },
      { name: 'Check Eligibility', href: '/check-eligibility' },
      { name: 'How It Works', href: '/funding/how-it-works' },
      { name: '— State Programs —', href: '/funding/state-programs', isHeader: true },
      { name: 'WIOA / WorkOne', href: '/funding/wioa' },
      { name: 'Workforce Ready Grant (WRG)', href: '/funding/wrg' },
      { name: 'SNAP E&T / IMPACT', href: '/snap-et-partner' },
      { name: 'Job Ready Indy (JRI)', href: '/partners/jri' },
      { name: 'All State Programs', href: '/funding/state-programs' },
      { name: '— Other Options —', href: '/funding', isHeader: true },
      { name: 'Self-Pay & Payment Plans', href: '/funding' },
      { name: 'OJT & Wage Reimbursement', href: '/ojt-and-funding' },
      { name: '— Apprenticeship Funding —', href: '/partners', isHeader: true },
      { name: 'DOL Registered Apprenticeships', href: '/apprenticeships' },
      { name: 'Apprenticeship Sponsors', href: '/apprenticeship-sponsor' },
    ],
  },
  {
    name: 'Testing',
    href: '/testing',
    subItems: [
      { name: '— Certification Exams —', href: '/testing', isHeader: true },
      { name: 'All Testing Providers', href: '/testing' },
      { name: 'NHA Healthcare Exams', href: '/testing' },
      { name: 'EPA 608 Certification', href: '/testing' },
      { name: 'Certiport (Microsoft, Adobe)', href: '/testing' },
      { name: 'WorkKeys / NCRC', href: '/testing' },
      { name: '— Schedule —', href: '/testing/book', isHeader: true },
      { name: 'Book a Testing Session', href: '/testing/book' },
      { name: 'Verify a Credential', href: '/verify' },
    ],
  },
  {
    name: 'About',
    href: '/about',
    subItems: [
      { name: '— Organization —', href: '/about', isHeader: true },
      { name: 'About Us', href: '/about' },
      { name: 'Our Mission', href: '/about/mission' },
      { name: 'Our Team', href: '/about/team' },
      { name: 'Outcomes', href: '/outcomes/indiana' },
      { name: 'Accreditation', href: '/accreditation' },
      { name: '— More —', href: '/about', isHeader: true },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact Us', href: '/contact' },
    ],
  },
  {
    name: 'Sign In',
    href: '/login',
  },
];

const PROGRAM_APPLY_LINKS = Object.fromEntries(
  ALL_PROGRAMS.filter((program) => Boolean(program.cta?.applyHref)).map((program) => [
    program.slug,
    program.cta.applyHref,
  ]),
);

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[70px] bg-white z-[9999] shadow-md"
      role="banner"
    >
      <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo - Always visible */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="Elevate for Humanity home"
        >
          <LogoImage alt="Elevate" width={40} height={60} className="w-auto h-10" priority />
          <span className="font-bold text-lg text-slate-900 hidden sm:block">Elevate</span>
        </Link>

        {/* Desktop Navigation - Server rendered */}
        <HeaderDesktopNav items={NAV_ITEMS} />

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/check-eligibility"
            prefetch={false}
            className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-red-700 transition-colors"
          >
            Check Eligibility
          </Link>
        </div>

        {/* Mobile Menu Toggle - Client component for interactivity */}
        <HeaderMobileMenu items={NAV_ITEMS} programApplyLinks={PROGRAM_APPLY_LINKS} />
      </div>
    </header>
  );
}
