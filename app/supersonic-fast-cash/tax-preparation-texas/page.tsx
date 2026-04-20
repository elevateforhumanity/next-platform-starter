export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';
import SfcLeadCaptureForm from '@/components/supersonic/SfcLeadCaptureForm';
import SfcTrustBar from '@/components/supersonic/SfcTrustBar';

const cities = [
  'Dallas', 'Houston', 'San Antonio', 'Austin', 'Fort Worth',
  'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock',
];

const bullets = [
  'PTIN-certified preparers — your return is signed by a credentialed professional',
  'Remote filing available — upload your documents and file from anywhere in Texas',
  'Same-day refund advance up to $7,500 — zero interest, zero fees',
  'Texas has no state income tax — federal filing only',
];

const services = [
  { label: 'W-2 & 1099 Filing', desc: 'Accurate preparation for employees and independent contractors.' },
  { label: 'Self-Employed & Schedule C', desc: 'Business income, deductions, and quarterly estimates.' },
  { label: 'EITC & Child Tax Credit', desc: 'We maximize every credit you are entitled to.' },
  { label: 'Federal Return Only', desc: 'Texas residents file federal only — no state income tax.' },
  { label: 'Amended Returns', desc: 'Corrections to prior-year federal returns.' },
  { label: 'Audit Protection', desc: 'One full year of IRS correspondence support included with every filing.' },
];

export default function TaxPreparationTexasPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-tax.jpg"
        alt="Tax preparation services in Texas"
        title="Tax Preparation in Texas"
        subtitle="Professional, affordable tax prep — in person and remote."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Cities callout */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Cities We Serve in Texas</h2>
          <p className="text-slate-600 leading-relaxed">
            {cities.join(', ')}, and surrounding communities statewide.
          </p>
        </section>

        {/* Why choose us */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Choose Supersonic Fast Cash in Texas</h2>
          <ul className="space-y-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Services */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Services Available in Texas</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map(({ label, desc }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{label}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dual CTA */}
        <section className="bg-brand-blue-900 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Ready to File in Texas?</h2>
          <p className="text-blue-200 mb-8">Start online or book an appointment — we&rsquo;re here to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/start"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Your Return
            </Link>
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-block bg-white text-brand-blue-900 hover:bg-slate-100 font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Book Appointment
            </Link>
          </div>
        </section>


        {/* Inline lead capture — state page funnel entry */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Ready to File in Texas?</h2>
              <p className="text-slate-600 text-center mb-8">Leave your info and we'll reach out to confirm your appointment.</p>
              <SfcLeadCaptureForm
                source="state_page"
                sourceDetail="tax-preparation-texas"
                serviceType="tax_prep"
                heading="Get Started — We'll Contact You"
                ctaLabel="Request a Callback"
              />
            </div>
          </div>
        </section>
      </main>

      <SfcTrustBar />
    </>
  );
}
