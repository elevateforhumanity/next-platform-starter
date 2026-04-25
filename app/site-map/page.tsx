import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Site Map | Elevate for Humanity',
  description: 'Directory of public pages on elevateforhumanity.org',
  alternates: { canonical: 'https://www.elevateforhumanity.org/site-map' },
};

const SECTIONS = [
  {
    title: 'Home',
    links: [
      { label: 'Home', href: '/' },
    ],
  },
  {
    title: 'Programs',
    links: [
      { label: 'All Programs', href: '/programs' },
      { label: 'HVAC Technician', href: '/programs/hvac-technician' },
      { label: 'CNA / Nursing Assistant', href: '/programs/cna' },
      { label: 'Medical Assistant', href: '/programs/medical-assistant' },
      { label: 'Phlebotomy', href: '/programs/phlebotomy' },
      { label: 'Pharmacy Technician', href: '/programs/pharmacy-technician' },
      { label: 'Home Health Aide', href: '/programs/home-health-aide' },
      { label: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist' },
      { label: 'CPR & First Aid', href: '/programs/cpr-first-aid' },
      { label: 'Welding', href: '/programs/welding' },
      { label: 'Electrical', href: '/programs/electrical' },
      { label: 'Plumbing', href: '/programs/plumbing' },
      { label: 'Construction Trades', href: '/programs/construction-trades-certification' },
      { label: 'Forklift Operator', href: '/programs/forklift' },
      { label: 'Diesel Mechanic', href: '/programs/diesel-mechanic' },
      { label: 'CDL Training', href: '/programs/cdl-training' },
      { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { label: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
      { label: 'Esthetician', href: '/programs/esthetician' },
      { label: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
      { label: 'IT Help Desk', href: '/programs/it-help-desk' },
      { label: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst' },
      { label: 'Network Administration', href: '/programs/network-administration' },
      { label: 'Software Development', href: '/programs/software-development' },
      { label: 'Web Development', href: '/programs/web-development' },
      { label: 'Tax Preparation', href: '/programs/tax-preparation' },
      { label: 'Bookkeeping', href: '/programs/bookkeeping' },
      { label: 'Business Administration', href: '/programs/business-administration' },
      { label: 'Entrepreneurship', href: '/programs/entrepreneurship' },
      { label: 'Project Management', href: '/programs/project-management' },
    ],
  },
  {
    title: 'Funding & Eligibility',
    links: [
      { label: 'Funding Overview', href: '/funding' },
      { label: 'Check My Eligibility', href: '/check-eligibility' },
      { label: 'How Funding Works', href: '/funding/how-it-works' },
      { label: 'WIOA / WorkOne', href: '/funding/wioa' },
      { label: 'Workforce Ready Grant', href: '/funding/wrg' },
      { label: 'State Programs', href: '/funding/state-programs' },
      { label: 'SNAP E&T / FSSA IMPACT', href: '/snap-et-partner' },
      { label: 'Job Ready Indy (JRI)', href: '/partners/jri' },
    ],
  },
  {
    title: 'Apply',
    links: [
      { label: 'Apply for Training', href: '/apply' },
      { label: 'Quick Application', href: '/apply/quick' },
      { label: 'Full Application', href: '/apply/full' },
      { label: 'Check Application Status', href: '/apply/status' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'Partner Overview', href: '/partners' },
      { label: 'Workforce Agencies', href: '/agencies' },
      { label: 'WorkOne / WIOA Referrals', href: '/partners/workforce' },
      { label: 'SNAP E&T Partners', href: '/snap-et-partner' },
      { label: 'Reentry Organizations', href: '/partners/reentry' },
      { label: 'Job Ready Indy', href: '/partners/jri' },
      { label: 'Barbershop Partners', href: '/partners/barbershop-apprenticeship' },
      { label: 'Cosmetology Partners', href: '/partners/cosmetology-apprenticeship' },
      { label: 'Become a Partner', href: '/partners/join' },
      { label: 'For Employers', href: '/for-employers' },
      { label: 'Hire Our Graduates', href: '/hire-graduates' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About Elevate', href: '/about' },
      { label: 'Our Mission', href: '/about/mission' },
      { label: 'Our Team', href: '/about/team' },
      { label: 'Outcomes', href: '/outcomes/indiana' },
      { label: 'Accreditation', href: '/accreditation' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Donate', href: '/donate' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Platform Overview', href: '/platform/overview' },
    ],
  },
  {
    title: 'Legal & Compliance',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Security & Data Protection', href: '/security-and-data-protection' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Consumer Education', href: '/consumer-education' },
      { label: 'FERPA Rights', href: '/ferpa' },
      { label: 'Refund Policy', href: '/refund-policy' },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-2">Site Map</h1>
          <p className="text-slate-400 text-sm">Public pages on elevateforhumanity.org</p>
        </div>
      </section>
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-100 pb-2">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-700 hover:text-brand-red-600 hover:underline transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
