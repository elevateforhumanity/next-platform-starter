import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Programs | Elevate for Humanity',
  description:
    'Workforce training programs in healthcare, skilled trades, and technology. WIOA, WRG, and FSSA funding available for eligible Indiana residents.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs' },
};

const CATEGORIES = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    href: '/programs/healthcare',
    description: 'State-approved clinical training leading to Indiana-recognized credentials.',
    color: 'blue',
    programs: [
      { title: 'Certified Nursing Assistant (CNA)', href: '/programs/cna', funding: 'FSSA IMPACT' },
      { title: 'Qualified Medication Aide (QMA)', href: '/programs/qma', funding: 'WIOA / WRG' },
      { title: 'Phlebotomy', href: '/programs/phlebotomy', funding: 'WIOA / WRG' },
      { title: 'Medical Assistant', href: '/programs/medical-assistant', funding: 'WIOA / WRG' },
      { title: 'Peer Recovery Specialist', href: '/programs/peer-recovery-specialist', funding: 'WIOA / WRG' },
      { title: 'Home Health Aide', href: '/programs/home-health-aide', funding: 'WIOA / WRG' },
    ],
  },
  {
    id: 'trades',
    label: 'Skilled Trades',
    href: '/programs/skilled-trades',
    description: 'Hands-on trade training with industry certification and job placement support.',
    color: 'orange',
    programs: [
      { title: 'CDL (Class A / B)', href: '/programs/cdl-training', funding: 'WIOA / WRG' },
      { title: 'Welding', href: '/programs/welding', funding: 'WIOA / WRG' },
      { title: 'Electrical', href: '/programs/electrical', funding: 'WIOA / WRG' },
      { title: 'Plumbing', href: '/programs/plumbing', funding: 'WIOA / WRG' },
      { title: 'Construction Trades', href: '/programs/construction-trades-certification', funding: 'WIOA / WRG' },
      { title: 'Diesel Mechanic', href: '/programs/diesel-mechanic', funding: 'WIOA / WRG' },
      { title: 'Forklift Operator', href: '/programs/forklift', funding: 'WIOA / WRG' },
    ],
  },
  {
    id: 'tech',
    label: 'Technology & Business',
    href: '/programs/technology',
    description: 'In-demand credentials in IT, cybersecurity, and business operations.',
    color: 'purple',
    programs: [
      { title: 'IT Help Desk', href: '/programs/it-help-desk', funding: 'WIOA / WRG' },
      { title: 'Cybersecurity Analyst', href: '/programs/cybersecurity-analyst', funding: 'WIOA / WRG' },
      { title: 'Network Administration', href: '/programs/network-administration', funding: 'WIOA / WRG' },
      { title: 'Network Support Technician', href: '/programs/network-support-technician', funding: 'WIOA / WRG' },
      { title: 'Software Development', href: '/programs/software-development', funding: 'WIOA / WRG' },
      { title: 'Web Development', href: '/programs/web-development', funding: 'WIOA / WRG' },
      { title: 'Office Administration', href: '/programs/office-administration', funding: 'WIOA / WRG' },
      { title: 'Business Administration', href: '/programs/business-administration', funding: 'WIOA / WRG' },
      { title: 'Entrepreneurship', href: '/programs/entrepreneurship', funding: 'WIOA / WRG' },
      { title: 'Project Management', href: '/programs/project-management', funding: 'WIOA / WRG' },
      { title: 'CAD / Drafting Technician', href: '/programs/cad-drafting', funding: 'WIOA / WRG' },
      { title: 'Graphic Design', href: '/programs/graphic-design', funding: 'WIOA / WRG' },
      { title: 'Hospitality & Customer Service', href: '/programs/hospitality', funding: 'WIOA / WRG' },
      { title: 'Tax Preparation', href: '/programs/tax-preparation', funding: 'Self-Pay' },
      { title: 'Bookkeeping', href: '/programs/bookkeeping', funding: 'WIOA / WRG' },
    ],
  },
  {
    id: 'certifications',
    label: 'Certifications',
    href: '/certifications',
    description: 'Short-duration credentials. Fast entry, skill-specific, low cost.',
    color: 'green',
    programs: [
      { title: 'HVAC Certification', href: '/programs/hvac-technician', funding: 'WIOA / WRG' },
      { title: 'CPR / First Aid', href: '/programs/cpr-first-aid', funding: 'Self-Pay' },
      { title: 'OSHA / Emergency Health & Safety', href: '/programs/emergency-health-safety', funding: 'Self-Pay' },
      { title: 'Sanitation & Infection Control', href: '/programs/sanitation-infection-control', funding: 'Self-Pay' },
    ],
  },
  {
    id: 'apprenticeships',
    label: 'Apprenticeships',
    href: '/apprenticeships',
    description: 'DOL-registered earn-while-you-learn programs. Work with a licensed employer from day one.',
    color: 'slate',
    programs: [
      { title: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', funding: 'DOL Registered' },
      { title: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship', funding: 'DOL Registered' },
      { title: 'Esthetician', href: '/programs/esthetician', funding: 'DOL Registered' },
      { title: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship', funding: 'DOL Registered' },
      { title: 'Culinary Apprenticeship', href: '/programs/culinary-apprenticeship', funding: 'DOL Registered' },
      { title: 'Beauty & Career Educator', href: '/programs/beauty-career-educator', funding: 'DOL Registered' },
    ],
  },
];

const C: Record<string, { header: string; badge: string; arrow: string; border: string; all: string }> = {
  blue:   { header: 'bg-blue-600',   badge: 'bg-blue-50 text-blue-700',     arrow: 'text-blue-600',   border: 'border-blue-200',   all: 'text-blue-700 hover:text-blue-900' },
  orange: { header: 'bg-orange-600', badge: 'bg-orange-50 text-orange-700', arrow: 'text-orange-600', border: 'border-orange-200', all: 'text-orange-700 hover:text-orange-900' },
  purple: { header: 'bg-purple-600', badge: 'bg-purple-50 text-purple-700', arrow: 'text-purple-600', border: 'border-purple-200', all: 'text-purple-700 hover:text-purple-900' },
  green:  { header: 'bg-green-700',  badge: 'bg-green-50 text-green-700',   arrow: 'text-green-700',  border: 'border-green-200',  all: 'text-green-700 hover:text-green-900' },
  slate:  { header: 'bg-slate-700',  badge: 'bg-slate-100 text-slate-700',  arrow: 'text-slate-600',  border: 'border-slate-200',  all: 'text-slate-700 hover:text-slate-900' },
};

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Workforce Training Programs</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">Programs That Lead to Jobs</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Every program ends with an industry-recognized credential and a direct path to employment.
            Funding available through WIOA, WRG, and FSSA for eligible participants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">Apply Now</Link>
            <Link href="/check-eligibility" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">Check Funding Eligibility</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {CATEGORIES.map((cat) => {
            const c = C[cat.color];
            return (
              <div key={cat.id}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className={`inline-block text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 ${c.header}`}>{cat.label}</span>
                    <p className="text-sm text-slate-500">{cat.description}</p>
                  </div>
                  <Link href={cat.href} className={`hidden sm:inline-flex items-center gap-1 text-sm font-bold shrink-0 ${c.all}`}>
                    All {cat.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.programs.map((prog) => (
                    <Link key={prog.href} href={prog.href} className={`group rounded-xl border ${c.border} bg-white p-5 hover:shadow-md transition-all`}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{prog.title}</h3>
                        <ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${c.arrow}`} />
                      </div>
                      <span className={`inline-block mt-3 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{prog.funding}</span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 sm:hidden">
                  <Link href={cat.href} className={`text-sm font-bold flex items-center gap-1 ${c.all}`}>All {cat.label} programs <ArrowRight className="w-4 h-4" /></Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-red-700 py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">Not Sure Where to Start?</h2>
          <p className="text-red-100 text-sm mb-6">Apply once. We&apos;ll match you to the right program and check your funding eligibility.</p>
          <Link href="/apply" className="inline-block bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm">Start Your Application</Link>
        </div>
      </section>
    </div>
  );
}
