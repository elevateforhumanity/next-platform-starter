import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Naomi Jordan | Our Team | Elevate for Humanity',
  description:
    'Naomi Jordan — Director of Healthcare Administration at Elevate for Humanity Technical and Career Institute. CNA, HHA, Phlebotomy Technician, QMA.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Team', href: '/about/team' }, { label: 'Naomi Jordan' }]}
        />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/about/team"
            className="inline-flex items-center text-sm text-black hover:text-brand-red-600 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
          </Link>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Photo placeholder — replace src when headshot is available */}
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-slate-100 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Photo coming soon</span>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Naomi Jordan</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-2">
                Director of Healthcare Administration
              </p>
              <p className="text-slate-500 text-sm mb-6">
                CNA &nbsp;·&nbsp; HHA &nbsp;·&nbsp; Phlebotomy Technician &nbsp;·&nbsp; QMA
              </p>

              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>
                  Naomi Jordan is the owner of Rebuilds Mind and Body Studio LLC, located at
                  6331 N Keystone Ave, Indianapolis, IN 46220. She holds active Indiana credentials
                  as a Certified Nursing Assistant (CNA), Home Health Aide (HHA), Phlebotomy
                  Technician, and Qualified Medication Aide (QMA).
                </p>
                <p>
                  As Director of Healthcare Administration at Elevate for Humanity, Naomi oversees
                  all healthcare program administration, clinical coordination, healthcare partner
                  relationships, and curriculum compliance for CNA, HHA, Phlebotomy, QMA, Medical
                  Assistant, Pharmacy Technician, and Peer Recovery Specialist programs.
                </p>
                <p>
                  She brings direct clinical experience to program design and ensures that
                  Elevate&apos;s healthcare graduates are fully prepared to pass state and national
                  credentialing exams and enter the healthcare workforce with the skills employers
                  demand.
                </p>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                  <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">
                    Credentials &amp; Affiliations
                  </h2>
                  {[
                    'Certified Nursing Assistant (CNA) — Indiana',
                    'Home Health Aide (HHA) — Indiana',
                    'Phlebotomy Technician — Indiana',
                    'Qualified Medication Aide (QMA) — Indiana',
                    'Owner — Rebuilds Mind and Body Studio LLC',
                    'Program Holder — Elevate for Humanity Healthcare Programs',
                  ].map((item) => (
                    <p key={item} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-brand-red-600 font-bold">·</span> {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
