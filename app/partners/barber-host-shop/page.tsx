import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Scissors, Users, DollarSign, CheckCircle, ArrowRight, MapPin } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Barber Host Shop Program',
  description: `Partner with ${PLATFORM_DEFAULTS.orgName} as a barber host shop. Earn revenue, build your team, and support workforce development in Indiana.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/barber-host-shop' },
};

export default function BarberHostShopPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative w-full aspect-[21/9] max-h-[560px] overflow-hidden bg-slate-100">
        <Image
          src="/images/pages/barber-shop-hero.webp"
          alt="Barber Host Shop Partnership"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-red-100 text-brand-red-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Scissors className="w-4 h-4" />
            Host Shop Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Become a Barber Host Shop
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Partner with Elevate to train the next generation of licensed barbers. Earn revenue from apprentice services, build your team, and support workforce development.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <BenefitCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Revenue Generation"
            description="Apprentices provide billable services under your license, generating additional revenue for your shop."
          />
          <BenefitCard
            icon={<Users className="w-8 h-8" />}
            title="Build Your Team"
            description="Train apprentices who can transition to employed barbers after completing their apprenticeship."
          />
          <BenefitCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="DOL Registered"
            description="Our apprenticeship program is DOL registered — apprentices earn while they learn with industry credentials."
          />
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
            How It Works
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <StepItem
              number={1}
              title="Apply to Become a Host Shop"
              description="Complete our host shop application and license verification."
              href="/partners/barber-host-shop/apply"
            />
            <StepItem
              number={2}
              title="Sign Partnership Agreement"
              description="Execute a host shop agreement covering roles, expectations, and revenue sharing."
            />
            <StepItem
              number={3}
              title="Receive Apprentice Referrals"
              description="We match qualified apprentices to your shop based on location and availability."
            />
            <StepItem
              number={4}
              title="Train and Employ"
              description="Apprentices train under your licensed barbers, earning hours toward their Indiana Barber License."
            />
          </div>
        </section>

        {/* Requirements */}
        <section className="bg-slate-50 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
            Host Shop Requirements
          </h2>
          <ul className="space-y-3">
            <RequirementItem text="Valid Indiana Barber Shop License" />
            <RequirementItem text="Minimum of one licensed barber mentor per apprentice" />
            <RequirementItem text="Adequate workspace for training" />
            <RequirementItem text="Willingness to complete mentor training" />
            <RequirementItem text="Compliance with DOL apprenticeship standards" />
          </ul>
        </section>

        {/* Locations */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
            Service Area
          </h2>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-5 h-5 text-brand-red-600" />
            <span>Indianapolis Metro Area and surrounding Indiana communities</span>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-red-600 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Ready to Become a Host Shop?
          </h2>
          <p className="text-red-100 mb-6 max-w-xl mx-auto">
            Apply today to join our network of barber host shops. Free to apply with no upfront cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/barber-host-shop/apply"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-600 font-bold px-8 py-4 rounded-xl transition-colors hover:bg-red-50"
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="text-brand-red-600 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
  href,
}: {
  number: number;
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold mt-2 hover:underline">
            Apply <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-slate-700">{text}</span>
    </li>
  );
}
