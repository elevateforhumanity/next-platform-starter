import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/training-providers' },
  title: 'Training Providers | Elevate For Humanity',
  description:
    'Become an approved training provider in the Elevate workforce network. Deliver industry-aligned training to funded participants with WIOA, WRG, and FSSA compliance support.',
};

const DELIVERY_MODELS = [
  {
    title: 'Elevate-Delivered',
    desc: 'Training and instruction provided directly by Elevate staff and credentialed instructors at our Indianapolis facility.',
  },
  {
    title: 'Partner-Delivered',
    desc: 'Training provided by approved providers in the Elevate network. You deliver instruction; we handle enrollment, funding, and compliance.',
  },
  {
    title: 'Hybrid',
    desc: 'Classroom instruction through Elevate combined with hands-on training at your facility or job site.',
  },
];

const REQUIREMENTS = [
  'Industry-aligned curriculum with measurable competency outcomes',
  'Qualified instructors with relevant industry credentials',
  'Capacity for student placement tracking and attendance reporting',
  'WIOA and state funding compliance reporting capability',
  'Liability insurance and applicable business licensure',
];

const FUNDING_SOURCES = [
  {
    label: 'WIOA',
    desc: 'Workforce Innovation & Opportunity Act. Federal funding for adults, dislocated workers, and youth. Requires ETPL listing.',
  },
  {
    label: 'Workforce Ready Grant',
    desc: 'Indiana state grant for high-demand certificate programs. Requires DWD approval.',
  },
  {
    label: 'FSSA IMPACT',
    desc: 'Indiana Family and Social Services Administration. For SNAP and TANF recipients.',
  },
  {
    label: 'DOL Apprenticeship',
    desc: 'DOL-registered apprenticeship programs. Elevate is a registered sponsor — partners can deliver OJT.',
  },
];

const PROCESS = [
  {
    n: '1',
    title: 'Submit a Partner Application',
    desc: 'Tell us about your organization, the training you deliver, and the credentials your programs lead to.',
  },
  {
    n: '2',
    title: 'Curriculum Review',
    desc: 'Our team reviews your curriculum for alignment with industry standards and funding source requirements.',
  },
  {
    n: '3',
    title: 'Compliance Onboarding',
    desc: 'We walk you through WIOA, WRG, and FSSA reporting requirements and set up your provider profile.',
  },
  {
    n: '4',
    title: 'MOU Execution',
    desc: 'We execute a Memorandum of Understanding defining roles, responsibilities, and reporting obligations.',
  },
  {
    n: '5',
    title: 'Student Referrals Begin',
    desc: 'Funded participants are referred to your program. We handle enrollment paperwork and funding authorization.',
  },
  {
    n: '6',
    title: 'Ongoing Reporting',
    desc: 'You submit attendance and completion data through our portal. We handle compliance reporting to funding agencies.',
  },
];

const PROGRAM_AREAS = [
  {
    title: 'Healthcare',
    desc: 'CNA, Medical Assistant, Phlebotomy, Peer Recovery Specialist.',
    image: '/images/pages/cna-patient-care.jpg',
  },
  {
    title: 'Skilled Trades',
    desc: 'HVAC, Electrical, Welding, Plumbing, CDL, Diesel Mechanic.',
    image: '/images/pages/hvac-unit.jpg',
  },
  {
    title: 'Technology',
    desc: 'IT Help Desk, Cybersecurity, Network Administration.',
    image: '/images/pages/it-helpdesk-desk.jpg',
  },
  {
    title: 'Business & Professional',
    desc: 'Bookkeeping, Tax Preparation, Office Administration.',
    image: '/images/pages/bookkeeping-ledger.jpg',
  },
  {
    title: 'Barbering & Cosmetology',
    desc: 'DOL-registered apprenticeships. Earn while you learn.',
    image: '/images/pages/barber-hero-main.jpg',
  },
  {
    title: 'CDL & Transportation',
    desc: 'Class A CDL training for commercial driving careers.',
    image: '/images/pages/cdl-truck-highway.jpg',
  },
];

const TRUST = [
  { stat: 'ETPL', label: 'Approved training provider — Indiana DWD' },
  { stat: 'DOL', label: 'Registered apprenticeship sponsor' },
  { stat: 'WIOA', label: 'Title I & II eligible programs' },
  { stat: 'FSSA', label: 'IMPACT program partner' },
];

export default function TrainingProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Training Providers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[45vh] min-h-[280px] max-h-[520px] w-full overflow-hidden">
        <Image
          src="/images/pages/training-providers-hero.webp"
          alt="Training providers — Elevate for Humanity workforce network"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Page identity */}
      <section className="border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            Workforce Training Network — Indianapolis, Indiana
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
            Become a Training Provider
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Join the Elevate workforce training network. Deliver industry-aligned training to funded
            participants — we handle enrollment, funding authorization, and compliance reporting.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/partners/apply"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Apply to Join the Network
            </Link>
            <Link
              href="/contact"
              className="border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-slate-900 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TRUST.map((t) => (
            <div key={t.stat} className="text-center">
              <p className="text-2xl font-extrabold text-white mb-1">{t.stat}</p>
              <p className="text-slate-400 text-xs leading-snug">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Program areas we need providers in */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Program Areas
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Where We Need Training Partners
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              We actively recruit providers in these high-demand fields. If your organization
              delivers training in any of these areas, we want to hear from you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROGRAM_AREAS.map((area) => (
              <div
                key={area.title}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={area.image}
                    alt={area.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{area.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery models */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Delivery Models
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How Training Is Delivered
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
              We work with providers across three delivery structures. Choose the model that fits
              your organization.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {DELIVERY_MODELS.map((m) => (
              <div key={m.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 text-base mb-3">{m.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to become a provider */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              The Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How to Become an Approved Provider
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
              From application to first student referral — here is every step.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROCESS.map((s) => (
              <div key={s.n} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="w-9 h-9 rounded-full bg-brand-red-600 text-white text-sm font-extrabold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements + Funding side by side */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12">
          <div>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
              Requirements
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Provider Requirements</h2>
            <ul className="space-y-3">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
              Funding Sources
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">
              Funding Your Participants Access
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Approved providers receive referrals of funded participants. Funding is authorized
              before enrollment — you are not responsible for collecting tuition.
            </p>
            <ul className="space-y-3">
              {FUNDING_SOURCES.map((f) => (
                <li key={f.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-900 text-sm mb-1">{f.label}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Photo + contact strip */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="/images/pages/training-providers-page-1.webp"
              alt="Training provider partnership"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Questions?
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4">
              Talk to Our Partnership Team
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              We work with training providers of all sizes — from individual instructors to
              established vocational schools. If you deliver quality training in a high-demand
              field, we want to connect.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Call us at{' '}
              <a
                href="tel:+13173143757"
                className="text-brand-red-600 font-semibold hover:underline"
              >
                (317) 314-3757
              </a>{' '}
              or submit the partner application and we will follow up within two business days.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/partners/apply"
                className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Apply to Join the Network
              </Link>
              <Link
                href="/contact"
                className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other partner types */}
      <section className="bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-3">Other ways to partner with Elevate</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/for-employers"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Hire Our Graduates
            </Link>
            <Link
              href="/apply/employer"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Employer Partnership
            </Link>
            <Link
              href="/apply/program-holder"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Become a Program Holder
            </Link>
            <Link
              href="/for-agencies"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Workforce Agency
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
