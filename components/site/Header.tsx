// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import { canonicalRoutes } from '@/lib/routes/canonical-routes';

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
// ── Navigation structure ──────────────────────────────────────────────────────
// Rule: 6 top-level items only. No portals in top nav — portals are post-login.
// Programs mega menu: 3 industry groups, canonical one-entry-per-program.
// Apprenticeships: separate from programs — DOL-registered, distinct system.
// Testing: infrastructure, not a sub-item of programs.
// Funding: overview + 4 named streams + single eligibility CTA.
// Partners: 3 roles — employers, agencies, training providers.
// Apply: single funnel entry point.
export const NAV_ITEMS = [
  // ── 1. Programs ─────────────────────────────────────────────────────────────
  {
    id: 'programs',
    name: 'Programs',
    href: '/programs',
    subItems: [
      // Healthcare
      { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
      { name: 'Certified Nursing Assistant (CNA)', href: canonicalRoutes.programs.certifiedNursingAssistant },
      { name: 'Qualified Medication Aide (QMA)', href: '/programs/qma' },
      { name: 'Phlebotomy', href: '/programs/phlebotomy' },
      { name: 'Medical Assistant', href: '/programs/medical-assistant' },
      { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { name: 'All Healthcare →', href: '/programs/healthcare' },
      // Skilled Trades
      { name: '— Skilled Trades —', href: '/programs/skilled-trades', isHeader: true },
      { name: 'CDL (Class A / B)', href: '/programs/cdl-training' },
      { name: 'HVAC Technician', href: canonicalRoutes.programs.hvacTechnician },
      { name: 'Welding', href: '/programs/welding' },
      { name: 'Electrical', href: '/programs/electrical' },
      { name: 'Plumbing', href: '/programs/plumbing' },
      { name: 'Construction Trades', href: '/programs/construction-trades-certification' },
      { name: 'All Trades →', href: '/programs/skilled-trades' },
      // Technology & Business
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
      { name: '— DOL Registered Apprenticeships —', href: '/apprenticeships', isHeader: true },
      { name: 'Barbering', href: '/programs/barber-apprenticeship' },
      { name: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
      { name: 'Esthetics / Nail Tech', href: '/programs/esthetician' },
      { name: 'Culinary Arts', href: '/programs/culinary-apprenticeship' },
      { name: '— Become a Host —', href: '/partners/barbershop-apprenticeship', isHeader: true },
      { name: 'Barbershop Partner', href: '/partners/barbershop-apprenticeship' },
      { name: 'Salon / Cosmetology Partner', href: '/partners/cosmetology-apprenticeship' },
      { name: 'Esthetician / Nail Partner', href: '/partners/esthetician-apprenticeship' },
      { name: 'All Apprenticeships →', href: '/apprenticeships' },
    ],
  },
  // ── 3. Testing ───────────────────────────────────────────────────────────────
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
      { name: 'Job Ready Indy', href: '/jri' },
      { name: '— Options —', href: '/funding', isHeader: true },
      { name: 'Self-Pay & Payment Plans', href: '/financing' },
      { name: 'OJT & Wage Reimbursement', href: '/ojt-and-funding' },
      { name: 'Check Eligibility →', href: '/check-eligibility' },
    ],
  },
  // ── 5. Partners ──────────────────────────────────────────────────────────────
  {
    id: 'partners',
    name: 'Partners',
    href: '/partners',
    subItems: [
      { name: '— Employers —', href: '/for-employers', isHeader: true },
      { name: 'Hire Our Graduates', href: '/for-employers' },
      { name: 'Post a Job / OJT', href: '/ojt-and-funding' },
      { name: 'Apprenticeship Sponsorship', href: '/apprenticeships' },
      { name: '— Workforce Agencies —', href: '/for-agencies', isHeader: true },
      { name: 'WIOA / WorkOne Referrals', href: '/for-agencies' },
      { name: 'FSSA / SNAP E&T', href: '/snap-et-partner' },
      { name: 'Reentry Organizations', href: '/for-agencies' },
      { name: '— Training Providers —', href: '/training-providers', isHeader: true },
      { name: 'Become a Training Provider', href: '/training-providers' },
      { name: 'Apply as a Provider', href: '/partners/apply' },
      { name: 'Partner Operating Model', href: '/partner-operating-model' },
      { name: 'All Partners →', href: '/partners' },
    ],
  },
  // ── 6. Apply ─────────────────────────────────────────────────────────────────
  {
    id: 'apply',
    name: 'Apply',
    href: '/apply',
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
            href="/login"
            prefetch={false}
            className="text-slate-600 font-semibold text-sm hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/apply"
            prefetch={false}
            className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-red-700 transition-colors"
          >
            Apply Now
          </Link>
        </div>

        {/* Mobile Menu Toggle - Client component for interactivity */}
        <HeaderMobileMenu items={NAV_ITEMS} programApplyLinks={PROGRAM_APPLY_LINKS} />
      </div>
    </header>
  );
}
