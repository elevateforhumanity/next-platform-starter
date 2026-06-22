import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Building2, Heart, GraduationCap, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Partner With Us',
  description: `Partner with ${PLATFORM_DEFAULTS.orgName} to expand workforce development impact. Employers, workforce agencies, community organizations, and training providers.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
};

export default function PartnersPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative w-full aspect-[21/9] max-h-[560px] overflow-hidden bg-slate-100">
        <Image
          src="/images/pages/about-employer-partners.webp"
          alt="Partner with Elevate"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Partner With Us
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Build workforce development partnerships that create measurable outcomes for your organization and the communities you serve.
          </p>
        </div>

        {/* Partner Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <PartnerCard
            icon={<Building2 className="w-8 h-8" />}
            title="Employers"
            description="Hire graduates, sponsor apprentices, provide OJT sites, and access WOTC tax credits."
            href="/for-employers"
          />
          <PartnerCard
            icon={<Users className="w-8 h-8" />}
            title="Workforce Agencies"
            description="WorkOne, FSSA, reentry programs, and social services referral partnerships."
            href="/for-agencies"
          />
          <PartnerCard
            icon={<Heart className="w-8 h-8" />}
            title="Community Partners"
            description="Co-enrollment, wraparound services, and shared mission alignment."
            href="/community-partners"
          />
          <PartnerCard
            icon={<GraduationCap className="w-8 h-8" />}
            title="Training Providers"
            description="Program holder agreements and facility-based training partnerships."
            href="/for-providers"
          />
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
            How to Partner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard
              number={1}
              title="Tell Us About Your Organization"
              description="Contact us with your organization type, size, and what you're trying to accomplish."
            />
            <StepCard
              number={2}
              title="Explore the Fit"
              description="We identify which partnership structure makes sense and what outcomes we can commit to."
            />
            <StepCard
              number={3}
              title="Sign an Agreement"
              description="We execute a partnership MOU or agreement covering roles, data, and expectations."
            />
            <StepCard
              number={4}
              title="Launch and Measure"
              description="We track shared outcomes and report back quarterly."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-blue-700 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Start a Partnership Conversation
          </h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Contact us to explore how we can work together. Call {PLATFORM_DEFAULTS.supportPhone} or use the form below.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/partnerships"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Learn More
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PartnerCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="text-brand-red-600 mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-6">
      <div className="w-10 h-10 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
        {number}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
