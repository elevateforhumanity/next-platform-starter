// Server Component - NO 'use client'
// Government-grade footer - clean, senior, compliant

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import LogoImage from '@/components/site/LogoImage';
import Copyright from '@/components/ui/Copyright';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/social-links';

// FOOTER STRUCTURE — 5 columns
// Col 1: Programs (healthcare, trades, tech, beauty, business)
// Col 2: Get Started (student path: apply → fund → enroll → portal)
// Col 3: Employers & Partners
// Col 4: Portals (role-gated — logged-in users only)
// Col 5: Organization
// Bottom: Legal
//
// Footer links: static config (intentional). Footer changes require a deploy regardless.
// Keeping links static avoids a DB round-trip on every page load. If CMS-editable
// footer links are needed, use the navigation_items table (extend schema first —
// add section, display_order int, is_active bool) and fetch with revalidate=3600.

const footerLinks = {
  // Column 1 — All program areas
  programs: [
    { name: 'All Programs', href: '/programs' },
    // Healthcare
    { name: 'Healthcare', href: '/programs/healthcare' },
    { name: 'CNA Training', href: '/programs/cna' },
    { name: 'Medical Assistant', href: '/programs/medical-assistant' },
    { name: 'Phlebotomy', href: '/programs/phlebotomy' },
    { name: 'Home Health Aide', href: '/programs/home-health-aide' },
    { name: 'Pharmacy Technician', href: '/programs/pharmacy-technician' },
    // Skilled Trades
    { name: 'Skilled Trades', href: '/programs/skilled-trades' },
    { name: 'HVAC Technician', href: '/programs/hvac-technician' },

    { name: 'Welding', href: '/programs/welding' },
    { name: 'Electrical', href: '/programs/electrical' },
    { name: 'Plumbing', href: '/programs/plumbing' },
    { name: 'Construction Trades', href: '/programs/construction-trades-certification' },
    { name: 'Forklift Operator', href: '/programs/forklift' },
    // Technology
    { name: 'Technology', href: '/programs/technology' },
    { name: 'IT Help Desk', href: '/programs/it-help-desk' },
    { name: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
    { name: 'Network Administration', href: '/programs/network-administration' },
    { name: 'Software Development', href: '/programs/software-development' },
    { name: 'Web Development', href: '/programs/web-development' },
    // Beauty & Apprenticeships
    { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
    { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
    { name: 'Esthetician', href: '/programs/esthetician' },
    { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship' },
    // Business & Finance
    { name: 'Business & Finance', href: '/programs/finance-bookkeeping-accounting' },
    { name: 'Bookkeeping', href: '/programs/bookkeeping' },
    { name: 'Entrepreneurship', href: '/programs/entrepreneurship' },
    { name: 'Tax Preparation', href: '/programs/tax-preparation' },
    { name: 'Project Management', href: '/programs/project-management' },
    // Other
    { name: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
    { name: 'CPR & First Aid', href: '/programs/cpr-first-aid' },
    { name: 'Certifications', href: '/programs' },
    { name: 'Testing & Exams', href: '/check-eligibility' },
    { name: 'Credential Verification', href: '/verify-credentials' },
  ],

  // Column 2 — Student path: apply → fund → enroll → portal
  getStarted: [
    { name: 'Check My Eligibility', href: '/start' },
    { name: 'Apply for Training', href: '/apply/student' },
    { name: 'WIOA Funding', href: '/wioa-eligibility' },
    { name: 'Tuition & Fees', href: '/financial-aid' },
    { name: 'Schedule Orientation', href: '/orientation' },
    { name: 'Consumer Education', href: '/consumer-education' },
    { name: 'Student Portal', href: '/learner' },
  ],

  // Column 3 — Employers and all partner types
  partners: [
    { name: 'Hire Our Graduates', href: '/for-employers' },
    { name: 'OJT Partnerships', href: '/partnerships' },
    { name: 'Post a Job', href: '/employer/post-job' },
    { name: 'Workforce Agencies', href: '/partners/workforce' },
    { name: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
    { name: 'Training Providers', href: '/partners/training-provider' },
    { name: 'Reentry Organizations', href: '/partners/reentry' },
    { name: 'Program Holders', href: '/program-holder' },
    { name: 'Become a Partner', href: '/partners/join' },
  ],

  // Column 4 — Role portals (authenticated users)
  portals: [
    // Learners
    { name: 'My Dashboard', href: '/my-dashboard', category: 'Learners' },
    { name: 'My Learning', href: '/learner/dashboard', category: 'Learners' },
    { name: 'My Courses', href: '/lms/dashboard', category: 'Learners' },
    // Education staff
    { name: 'Instructor Portal', href: '/instructor/dashboard', category: 'Education Staff' },
    // Employers & partners
    { name: 'Employer Portal', href: '/employer/dashboard', category: 'Employers & Partners' },
    { name: 'Partner Portal', href: '/partner/dashboard', category: 'Employers & Partners' },
    // Program administration
    { name: 'Program Holder Portal', href: '/program-holder/dashboard', category: 'Program Administration' },
    { name: 'Training Provider Portal', href: '/provider/dashboard', category: 'Program Administration' },
    { name: 'Case Manager Portal', href: '/case-manager/dashboard', category: 'Program Administration' },
    // Internal
    { name: 'Staff Portal', href: '/staff-portal/dashboard', category: 'Internal' },
    { name: 'Admin Dashboard', href: '/admin/dashboard', category: 'Internal' },
  ],

  // Column 5 — Organization
  organization: [
    { name: 'About Elevate', href: '/about' },
    { name: 'Our Team', href: '/about/team' },
    { name: 'Outcomes', href: '/outcomes/indiana' },
    { name: 'Accreditation', href: '/accreditation' },
    { name: 'Compliance', href: '/compliance' },

    { name: 'Donate', href: '/donate' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Site Map', href: '/site-map' },
  ],

  legal: [
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Security & Data', href: '/security-and-data-protection' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Site Map', href: '/site-map' },
  ],
};

export default function ServerFooter() {
  return (
    <footer className="bg-slate-900 text-white" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Institutional Identity */}
        <div className="mb-10 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Logo alt="Elevate for Humanity" width={32} height={48} className="w-auto h-8" />
            <span className="text-lg font-bold text-white">Elevate for Humanity</span>
          </div>
          <p className="text-sm text-white max-w-2xl leading-relaxed">
            National workforce training platform connecting online technical instruction, industry credentials, and employer pathways. Programs aligned with EPA, CompTIA, PTCB, Microsoft, and OSHA certifications.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-white">
            <span>DOL Registered Apprenticeship Sponsor</span>
            <span className="text-white">·</span>
            <span>ETPL Listed Training Provider</span>
            <span className="text-white">·</span>
            <span>WIOA Title I Approved</span>
            <span className="text-white">·</span>
            <span>WorkOne Workforce Partner</span>
          </div>
        </div>

        {/* 4-Column Footer — mirrors nav hierarchy */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Programs */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Programs</h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Get Started */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Get Started</h3>
            <ul className="space-y-3">
              {footerLinks.getStarted.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Employers & Partners */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Employers & Partners</h3>
            <ul className="space-y-3">
              {footerLinks.partners.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Organization */}
          <div>
            <h3 className="font-semibold mb-4 text-white text-sm uppercase tracking-wide">Organization</h3>
            <ul className="space-y-3">
              {footerLinks.organization.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer CTA */}
        <div className="border-t border-slate-800 pt-8 pb-8 mb-8 text-center">
          <p className="text-sm text-white mb-4">Ready to start your career? Explore funded training programs.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              Apply for Training
            </Link>
            <Link href="/partnerships" className="border border-slate-600 text-white hover:text-white hover:border-slate-400 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
              Partner With Us
            </Link>
          </div>
        </div>

        {/* Credential Alignment */}
        <div className="border-t border-slate-800 pt-6 pb-6 mb-6 text-center">
          <p className="text-[10px] text-white max-w-3xl mx-auto leading-relaxed">
            Programs aligned with industry-recognized certifications including EPA Section 608, CompTIA A+, CompTIA Security+, PTCB CPhT, Microsoft Office Specialist, OSHA 30, and Indiana state licensing requirements. Credential outcomes are issued by the respective certifying organizations.
          </p>
        </div>

        {/* Bottom Bar: Legal Links + Copyright */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-3">
              <LogoImage
                alt="Elevate"
                width={28}
                height={42}
                className="w-auto h-7"
              />
              <p className="text-white text-sm">
                <Copyright entity="2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute" />
              </p>
            </div>
            
            {/* Contact */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white text-sm mb-4">
              <a href="tel:+13173143757" className="hover:text-white">(317) 314-3757</a>
              <span className="text-white">|</span>
              <a href="mailto:info@elevateforhumanity.org" className="hover:text-white">info@elevateforhumanity.org</a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {SOCIAL_LINKS.facebook && (
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {SOCIAL_LINKS.instagram && (
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {SOCIAL_LINKS.linkedin && (
                <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-white hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {SOCIAL_LINKS.youtube && (
                <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Authority Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {[
                { abbr: 'USDOL', label: 'DOL Registered Sponsor' },
                { abbr: 'ETPL', label: 'Approved Training Provider' },
                { abbr: 'Certiport', label: 'Authorized Testing Center' },
                { abbr: 'EPA 608', label: 'Certification Prep' },
                { abbr: 'OSHA', label: 'Safety Training' },
              ].map((b) => (
                <span key={b.abbr} className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-white border border-slate-700">
                  {b.abbr}
                </span>
              ))}
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href} 
                  className="text-white hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-6 pt-6 border-t border-slate-800">
<p className="text-[10px] leading-relaxed text-slate-500 max-w-4xl mx-auto text-center">
                Elevate for Humanity Career &amp; Technical Institute is a DOL Registered Apprenticeship Sponsor, Indiana ETPL-listed workforce training provider, and Certiport Authorized Testing Center operating under 2Exclusive LLC-S. Industry certifications are issued by the respective credentialing bodies (CompTIA, NHA, EPA, NCCCO, etc.) upon passing the required exams — these are the same credentials employers hire for. Training may be fully funded for eligible participants through WIOA, Workforce Ready Grant, JRI, and approved workforce partners; eligibility is determined by the applicable agency. Elevate for Humanity Career &amp; Technical Institute is a workforce training organization, not a degree-granting postsecondary institution under the Indiana Department of Education — our programs lead to industry certifications and employment, not academic degrees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
