// Server Component - NO 'use client'
// This header renders on the server and is visible even with JS disabled

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import HeaderMobileMenu from './HeaderMobileMenu.client';
import HeaderDesktopNav from './HeaderDesktopNav';
import SearchModal from './SearchModal.client';
import LanguageSwitcher from './LanguageSwitcher.client';
import { NAV_ITEMS } from '@/lib/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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
// NAV_ITEMS imported from @/lib/navigation — single source of truth.

const PROGRAM_APPLY_LINKS = Object.fromEntries(
  ALL_PROGRAMS.filter((program) => Boolean(program.cta?.applyHref)).map((program) => [
    program.slug,
    program.cta.applyHref,
  ]),
);

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] bg-white z-[9999] shadow-sm border-b border-slate-100"
      role="banner"
    >
      <div className="max-w-screen-2xl mx-auto w-full h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - Always visible */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="{PLATFORM_DEFAULTS.orgName} home"
        >
          <LogoImage alt="Elevate" width={40} height={60} className="w-auto h-10" priority />
          <span className="font-bold text-base text-slate-900 hidden sm:block">Elevate</span>
        </Link>

        {/* Desktop Navigation - Server rendered */}
        <HeaderDesktopNav items={NAV_ITEMS} />

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <SearchModal />
          <LanguageSwitcher />
          <Link
            href="/login"
            prefetch={false}
            className="text-slate-600 font-semibold text-[13px] hover:text-slate-900 transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-50"
          >
            Sign In
          </Link>
          <Link
            href="/for-students"
            prefetch={false}
            className="bg-brand-red-600 text-white px-3.5 py-1.5 rounded-lg font-semibold text-[13px] hover:bg-brand-red-700 transition-colors whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle - Client component for interactivity */}
        <HeaderMobileMenu items={NAV_ITEMS} programApplyLinks={PROGRAM_APPLY_LINKS} />
      </div>
    </header>
  );
}
