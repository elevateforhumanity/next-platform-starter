import { getEnrollmentCount } from '@/lib/programs/getEnrollmentCount';
export const revalidate = 3600;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, DollarSign, Award, CheckCircle } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import { HostShopRequirements } from '@/components/compliance/HostShopRequirements';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Beauty Industry Apprenticeships | Barber, Cosmetology, Esthetics, Nails',
  description:
    'DOL-registered apprenticeship programs in barbering, cosmetology, esthetics, and nail technology. Earn while you learn with flat-fee pricing. ETPL approved.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/beauty',
  },
};

const PROGRAMS = [
  {
    title: 'Barber Apprenticeship',
    description: 'Complete 2,000-hour apprenticeship to become a licensed barber in Indiana. Learn cutting, styling, shaving, and business skills.',
    href: '/programs/barber-apprenticeship',
    image: '/hero-images/barber-hero.jpg',
    hours: 2000,
    price: '$4,980',
    duration: '15–24 months',
    highlights: ['Indiana IPLA compliant', 'Milady Theory included', 'Hour logging system'],
  },
  {
    title: 'Cosmetology Apprenticeship',
    description: 'Full cosmetology training covering hair, skin, and nails. 1,500-hour program prepares you for state licensure.',
    href: '/programs/cosmetology-apprenticeship',
    image: '/hero-images/barber-beauty-cat-new.jpg',
    hours: 1500,
    price: '$4,980',
    duration: '12–18 months',
    highlights: ['Complete beauty training', 'Hair, skin & nails', 'State license prep'],
  },
  {
    title: 'Esthetician Apprenticeship',
    description: 'Specialize in skincare with 700 hours of training. Learn facials, treatments, and advanced skin techniques.',
    href: '/programs/esthetician-apprenticeship',
    image: '/hero-images/barber-beauty-cat-new.jpg',
    hours: 700,
    price: '$3,480',
    duration: '6–9 months',
    highlights: ['Skincare specialty', 'Facial techniques', 'Treatment protocols'],
  },
  {
    title: 'Nail Technician Apprenticeship',
    description: 'Master nail artistry with 450 hours of training. Learn manicures, pedicures, acrylics, and nail art.',
    href: '/programs/nail-technician-apprenticeship',
    image: '/hero-images/barber-beauty-cat-new.jpg',
    hours: 450,
    price: '$2,980',
    duration: '4–6 months',
    highlights: ['Nail artistry', 'Acrylics & gels', 'Salon business skills'],
  },
];

const WHY = [
  { icon: DollarSign, label: 'Earn While Learning', detail: 'Work in a salon and earn income while completing your training hours.' },
  { icon: Clock,      label: 'Flexible Schedule',   detail: 'Complete hours at your own pace while working with your sponsor.' },
  { icon: Award,      label: 'State Licensure',     detail: 'Programs meet Indiana state requirements for professional licensure.' },
  { icon: CheckCircle,label: 'DOL Registered',      detail: 'Official U.S. Department of Labor registered apprenticeship programs.' },
];

export default async function BeautyProgramsPage() {
  const enrollmentCount = await getEnrollmentCount('barber-apprenticeship');
  const b = heroBanners['barber-apprenticeship'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Video hero — uses barber video/poster; same beauty category */}
      <HeroVideo
        videoSrcDesktop={b.videoSrcDesktop}
        posterImage={b.posterImage}
        voiceoverSrc={'voiceoverSrc' in b ? b.voiceoverSrc : undefined}
        microLabel="DOL Registered Apprenticeships"
        analyticsName="beauty-programs"
        belowHeroHeadline="Beauty Industry Apprenticeships"
        belowHeroSubheadline="Barber · Cosmetology · Esthetics · Nails — earn while you learn with flat-fee pricing and DOL-registered programs."
        ctas={[
          { label: 'View Programs', href: '#programs' },
          { label: 'Apply Now', href: '/apply?program=barber-apprenticeship', variant: 'secondary' },
        ]}
        trustIndicators={['DOL Registered', 'ETPL Approved', 'Earn wages from day one', 'Flat-fee pricing']}
      />

      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Beauty' },
        ]}
      />

      <PathwayDisclosure programName="Beauty" programSlug="beauty" />

      {/* Why apprenticeship */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Why Choose an Apprenticeship?</h2>
      {enrollmentCount > 0 && (
        <p className="text-sm text-slate-500 mt-1">
          {enrollmentCount.toLocaleString()} learners currently enrolled
        </p>
      )}
            <p className="text-slate-600 max-w-xl mx-auto">A proven path to licensure with real-world experience and income from day one.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
                <Icon className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">{label}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program cards */}
      <section id="programs" className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Choose Your Program</h2>
            <p className="text-slate-600">All programs include theory materials, hour logging, and career support.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {PROGRAMS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group bg-white rounded-xl border border-slate-200 hover:border-brand-blue-400 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                    <span className="text-sm font-bold text-slate-900">{p.price}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed flex-1">{p.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{p.hours.toLocaleString()} hours</span>
                    <span>{p.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.highlights.map((h) => (
                      <span key={h} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">{h}</span>
                    ))}
                  </div>
                  <div className="flex items-center text-brand-blue-600 font-semibold text-sm group-hover:text-brand-blue-700">
                    Learn More <ArrowRight className="w-4 h-4 ml-1.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HostShopRequirements
        programTrack="all"
        showApprovalProcess={true}
        showMultiRegion={true}
      />

      {/* Important notice */}
      <section className="py-10 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-lg font-bold text-amber-900 mb-3">Important Notice</h3>
          <p className="text-amber-800 text-sm leading-relaxed">
            These apprenticeship programs are not a substitute for licensed cosmetology, barber, esthetician, or nail technician schools.
            Apprenticeships are an alternative pathway to licensure that requires working under a licensed sponsor.
            You must secure a sponsor before beginning your apprenticeship hours.
          </p>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Beauty & Cosmetology"
            partnerCertifications={[
              'Indiana Cosmetology License (issued by Indiana Professional Licensing Agency)',
              'Indiana Barber License (issued by Indiana Professional Licensing Agency)',
              'Indiana Esthetician License (issued by Indiana Professional Licensing Agency)',
              'Indiana Manicurist License (issued by Indiana Professional Licensing Agency)',
            ]}
            employmentOutcomes={[
              'Licensed Cosmetologist', 'Licensed Barber', 'Licensed Esthetician',
              'Licensed Nail Technician', 'Salon/Barbershop Owner',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Beauty Career?</h2>
          <p className="text-slate-300 mb-8">Check eligibility first — takes just 5 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=barber-apprenticeship"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-xl font-bold transition-colors"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-xl font-bold transition-colors"
            >
              Check Funding Eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
