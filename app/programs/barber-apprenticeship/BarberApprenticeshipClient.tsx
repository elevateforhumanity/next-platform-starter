'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroVideo from '@/components/marketing/HeroVideo';
import type { HeroBannerConfig } from '@/content/heroBanners';
import {
  Award, Clock, ChevronRight, MapPin, BookOpen,
  Briefcase, TrendingUp, DollarSign, AlertTriangle,
  Building2, FileText, ClipboardList,
} from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { BarberEnrollment } from './sections/BarberEnrollment';
import { BarberCredentials } from './sections/BarberCredentials';
import { BarberDeliveryModel } from './sections/BarberDeliveryModel';
import { BarberPartnership } from './sections/BarberPartnership';

interface Props { program: ProgramSchema; heroBanner: HeroBannerConfig | null; enrollmentCount?: number; }

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function BarberApprenticeshipClient({ program: p, heroBanner: b, enrollmentCount = 0 }: Props) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ HERO ═══ */}
      {b && (
        <HeroVideo
          videoSrcDesktop={b.videoSrcDesktop}
          posterImage={b.posterImage}
          voiceoverSrc={b.voiceoverSrc}
          microLabel={b.microLabel}
          analyticsName={b.analyticsName}
        />
      )}

      {/* ═══ PROGRAM IDENTITY CARD (below video) ═══ */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/programs" className="hover:text-brand-blue-600">Programs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Barber Apprenticeship</span>
          </nav>
          <div className="flex items-start gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Barber Apprenticeship</h1>
            <span className="flex-shrink-0 text-xs font-bold text-white px-3 py-1 rounded-full bg-brand-blue-600">DOL Registered</span>
          </div>
          <p className="text-slate-600 text-lg mb-6">{p.subtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
            <SpecItem icon={Clock} label="Duration" value="52 weeks" />
            <SpecItem icon={BookOpen} label="Hours/Week" value="15–20 hrs" />
            <SpecItem icon={MapPin} label="Delivery" value="Hybrid" />
            <SpecItem icon={Award} label="Credentials" value={`${p.credentials.length} earned`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span><strong>Schedule:</strong> {p.schedule}</span>
            <span><strong>Active Apprentices:</strong> {enrollmentCount > 0 ? enrollmentCount : 'Enrolling now'}</span>
            <span><strong>Earn while you train:</strong> $12–$15/hr at your host shop</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="inline-flex items-center justify-center rounded-xl bg-brand-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-red-700"
            >
              Apply Now
            </Link>
            {installPrompt ? (
              <button
                type="button"
                onClick={handleInstallPwa}
                disabled={installing}
                className="inline-flex items-center justify-center rounded-xl border border-brand-blue-600 px-6 py-3 text-base font-semibold text-brand-blue-700 transition-colors hover:bg-brand-blue-50 disabled:opacity-60"
              >
                {installing ? 'Opening install prompt...' : 'Download Student App'}
              </button>
            ) : (
              <Link
                href="/pwa/barber/onboarding"
                className="inline-flex items-center justify-center rounded-xl border border-brand-blue-600 px-6 py-3 text-base font-semibold text-brand-blue-700 transition-colors hover:bg-brand-blue-50"
              >
                Open Mobile App View
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══ DISCLOSURE BANNER ═══ */}
      <section className="bg-amber-50 border-y border-amber-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Now Enrolling — Indianapolis Metro</p>
            <p className="text-sm text-amber-800 mt-1">
              DOL Registered Apprenticeship program. Spots are limited — we match each apprentice with a licensed host barbershop.{' '}
              <Link href="/programs/barber-apprenticeship/apply" className="underline font-medium">Apply now to reserve your place.</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CAREER PATHWAY (condensed paragraph) ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Career Pathway</h2>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Start as a <strong>Barber Apprentice</strong> earning $24,000–$30,000 while you train under a licensed barber at a host shop.
              After completing 2,000 hours and passing the Indiana state exam, you become a <strong>Licensed Barber</strong> ($30,000–$45,000).
              With 3–5 years of experience and an established clientele, you advance to <strong>Senior Barber</strong> ($45,000–$65,000).
              Many graduates go on to open their own shop as a <strong>Shop Owner / Master Barber</strong> ($65,000–$100,000+).
            </p>
          </div>
          <div className="relative h-72 rounded-xl overflow-hidden shadow-lg">
            <Image src="/images/pages/barber-fade-cut.webp" alt="Barber performing a precision fade cut" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* ═══ MEASURABLE OUTCOMES (condensed paragraph) ═══ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-72 rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <Image src="/images/pages/barber-straight-razor.webp" alt="Barber performing a straight razor shave" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Measurable Outcomes</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                By program completion, apprentices perform six standard haircut styles — fade, taper, buzz, scissor-over-comb,
                flat top, and shape-up — to client satisfaction. You will execute straight razor shaves following Indiana
                sanitation protocols, identify and treat common scalp conditions, and demonstrate proper disinfection procedures
                per Indiana Board standards. Each apprentice completes 2,000 total hours (1,500 OJT at a licensed shop + 500 RTI),
                builds a client portfolio of 50+ documented services, and passes the Indiana Barber License written and practical exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CREDENTIALS EARNED (image blocks, no OSHA 10) ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Credentials Earned</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { img: '/images/pages/barber-tools-closeup.webp', alt: 'Barber tools and clippers', cred: p.credentials[0] },
            { img: '/images/pages/barber-client-consult.webp', alt: 'Barber consulting with client', cred: p.credentials[1] },
            { img: '/images/pages/barber-shop-wide.webp', alt: 'Professional barbershop interior', cred: p.credentials[2] },
          ].filter(item => item.cred).map((item, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden hover:border-brand-blue-300 transition-colors">
              <div className="relative h-44">
                <Image src={item.img} alt={item.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{item.cred.name}</h3>
                <p className="text-xs text-brand-blue-600 font-medium mt-1">Issued by {item.cred.issuer}</p>
                <p className="text-sm text-slate-600 mt-2">{item.cred.description}</p>
                {item.cred.validity && <p className="text-xs text-slate-500 mt-2">Valid: {item.cred.validity}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRAINING DELIVERY (RTI / OJT / Progress / Oversight) ═══ */}
      <BarberDeliveryModel />

      {/* ═══ CREDENTIAL PATHWAY + WHAT YOU’LL LEARN + WORKPLACE TRAINING ═══ */}
      <BarberCredentials />

      {/* ═══ PARTNERSHIP / CAREER PATHWAYS / TRANSFER HOURS ═══ */}
      <BarberPartnership />

      {/* ═══ FUNDING & PAYMENT OPTIONS (WIOA · SNAP E&T · Self-Pay · Payment Plan · BNPL) ═══ */}
      <section id="funding" className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Funding &amp; Payment Options</h2>
          </div>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Total program tuition is <strong>$4,980</strong>. You don’t pay anything to apply. After review, we work with you on the option that fits.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                tag: 'Workforce Funding',
                title: 'WIOA / SNAP E&T (IMPACT)',
                body: 'Eligible Indiana residents may have tuition fully covered through state and federal workforce programs. We help you check eligibility.',
                cta: { label: 'Check Eligibility', href: '/check-eligibility?program=barber-apprenticeship' },
              },
              {
                tag: 'Self-Pay',
                title: 'Pay in Full',
                body: 'Pay $4,731 upfront and save $249 (5% discount). Single Stripe charge — card, ACH, Cash App, or Amazon Pay.',
                cta: { label: 'Apply & Pay in Full', href: '/programs/barber-apprenticeship/apply?payment=pay_in_full' },
              },
              {
                tag: 'Payment Plan',
                title: '$600 down + 29 weekly',
                body: 'Start with $600 minimum down payment, then split the balance over 29 weekly installments. No interest, no credit check.',
                cta: { label: 'Apply on Plan', href: '/programs/barber-apprenticeship/apply?payment=payment_plan' },
              },
              {
                tag: 'BNPL',
                title: 'Klarna · Afterpay',
                body: 'Split tuition into 4 interest-free payments via Stripe-native BNPL. Approval handled instantly at checkout.',
                cta: { label: 'Pay with Klarna / Afterpay', href: '/programs/barber-apprenticeship/apply?payment=bnpl' },
              },
              {
                tag: 'BNPL',
                title: 'Affirm',
                body: 'Monthly installments through Affirm — terms set by lender. Soft credit check at checkout.',
                cta: { label: 'Pay with Affirm', href: '/programs/barber-apprenticeship/apply?payment=affirm' },
              },
              {
                tag: 'BNPL',
                title: 'Sezzle',
                body: '4 interest-free payments over 6 weeks via Sezzle. Quick approval at checkout.',
                cta: { label: 'Pay with Sezzle', href: '/programs/barber-apprenticeship/apply?payment=sezzle' },
              },
            ].map((opt) => (
              <div key={opt.title} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wide text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded mb-3">
                  {opt.tag}
                </span>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{opt.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{opt.body}</p>
                <Link
                  href={opt.cta.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
                >
                  {opt.cta.label} →
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/programs/barber-apprenticeship/payment/bnpl"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-800"
            >
              Compare all BNPL providers →
            </Link>
            <span className="text-xs text-slate-500">
              Funding eligibility determined after application review. Payment method is selected at that point — not upfront.
            </span>
          </div>
        </div>
      </section>

      <BarberEnrollment />

      {/* ═══ CTA: MID-PAGE ═══ */}
      <section className="py-10 border-t bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-slate-700 font-medium mb-4">Ready to get started? Apply first — we handle the rest.</p>
          <Link
            href="/programs/barber-apprenticeship/apply"
            className="inline-flex items-center justify-center rounded-xl bg-brand-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-red-700"
          >
            Apply Now
          </Link>
          <p className="mt-3 text-sm text-slate-500">See payment options and funding paths.</p>
        </div>
      </section>

      {/* ═══ CAREER OUTCOMES / LABOR MARKET ═══ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Career Outcomes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-brand-green-50 rounded-lg p-6 text-center border border-brand-green-100">
              <DollarSign className="w-8 h-8 text-brand-green-600 mx-auto" />
              <div className="text-3xl font-bold text-slate-900 mt-2">${p.laborMarket.medianSalary.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Median Annual Salary</div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-6 text-center border border-brand-blue-100">
              <TrendingUp className="w-8 h-8 text-brand-blue-600 mx-auto" />
              <div className="text-3xl font-bold text-slate-900 mt-2">{p.laborMarket.growthRate}</div>
              <div className="text-sm text-slate-600">Job Growth (10-year)</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-lg font-bold text-slate-900 mt-2">{p.laborMarket.salaryRange}</div>
              <div className="text-sm text-slate-600">Salary Range ({p.laborMarket.region})</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {p.careers.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-slate-200">
                <span className="font-medium text-slate-900 text-sm">{c.title}</span>
                <span className="text-sm text-brand-green-700 font-medium">{c.salary}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">Source: {p.laborMarket.source}, {p.laborMarket.sourceYear}</p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {p.faqs.map((faq, i) => (
            <details key={i} className="group bg-white border border-slate-200 rounded-lg overflow-hidden">
              <summary className="px-5 py-4 cursor-pointer font-medium text-slate-900 hover:bg-white transition-colors flex items-center justify-between">
                {faq.question}
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>



      {/* ═══ INSTITUTIONAL FOOTER ═══ */}
      <section className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-slate-600">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase mb-2">Admission Requirements</h3>
              <ul className="space-y-1">
                {p.admissionRequirements.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase mb-2">What&apos;s Included</h3>
              <ul className="space-y-1">
                {p.pricingIncludes.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs uppercase mb-2">Employer Partners</h3>
              <ul className="space-y-1">
                {p.employerPartners.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
              {p.bilingualSupport && <p className="mt-3 text-xs text-slate-500">{p.bilingualSupport}</p>}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-400 space-y-1">
            <p>Modality: {p.modality}</p>
            <p>Facility: {p.facilityInfo}</p>
            <p>Equipment: {p.equipmentIncluded}</p>
            <p>Tuition: $4,980 if self-pay. Funding and payment plans available — determined after application review.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="w-5 h-5 text-brand-blue-600 mx-auto mb-1" />
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="font-semibold text-slate-900 text-sm">{value}</div>
    </div>
  );
}
