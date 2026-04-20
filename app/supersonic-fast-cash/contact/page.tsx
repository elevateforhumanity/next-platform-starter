export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';
import SfcLeadCaptureForm from '@/components/supersonic/SfcLeadCaptureForm';
import SfcTrustBar from '@/components/supersonic/SfcTrustBar';

export default function ContactPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/subpage-tax-hero.jpg"
        alt="Contact Supersonic Fast Cash"
        title="Contact Supersonic Fast Cash"
        subtitle="We're here to help. Reach us by phone, email, or walk in."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Contact info block */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                <a href="tel:3173143757" className="text-2xl font-black text-brand-blue-900 hover:text-brand-red-600 transition-colors">
                  (317) 314-3757
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
                <a href="mailto:info@supersonicfastcash.com" className="text-lg font-semibold text-brand-blue-900 hover:text-brand-red-600 transition-colors break-all">
                  info@supersonicfastcash.com
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-slate-700 font-semibold">Indianapolis, IN</p>
                <p className="text-slate-500 text-sm">Midwest&rsquo;s Premier Tax Preparation Service</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Hours</p>
                <ul className="text-slate-700 text-sm space-y-1">
                  <li>Mon – Fri: 9am – 7pm ET</li>
                  <li>Saturday: 10am – 4pm ET</li>
                  <li>Sunday: Closed</li>
                  <li className="text-brand-red-600 font-semibold">Tax season (Jan–Apr): extended hours available</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3 ways to reach us */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">3 Ways to Reach Us</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Call / Text',
                detail: '(317) 314-3757',
                desc: 'Fastest response. Our team answers calls and texts during business hours.',
                href: 'tel:3173143757',
                cta: 'Call Now',
              },
              {
                title: 'Email',
                detail: 'info@supersonicfastcash.com',
                desc: 'For documents and non-urgent questions. We respond within one business day.',
                href: 'mailto:info@supersonicfastcash.com',
                cta: 'Send Email',
              },
              {
                title: 'Walk-In',
                detail: 'Indianapolis, IN',
                desc: 'Walk-ins welcome. Appointments get priority during tax season.',
                href: '/supersonic-fast-cash/book-appointment',
                cta: 'Book Appointment',
              },
            ].map(({ title, detail, desc, href, cta }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
                <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                <p className="text-brand-red-600 font-semibold text-sm break-all">{detail}</p>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">{desc}</p>
                <a
                  href={href}
                  className="inline-block mt-2 text-center bg-brand-blue-900 hover:bg-brand-red-600 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
                >
                  {cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Tax season note */}
        <section className="bg-brand-red-600 text-white rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold">January – April: Walk-ins welcome. Appointments get priority.</p>
          <Link
            href="/supersonic-fast-cash/book-appointment"
            className="inline-block mt-4 bg-white text-brand-red-600 font-bold px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Book an Appointment
          </Link>
        </section>

        {/* Lead capture — turns contact page into a funnel entry point */}
        <section>
          <div className="max-w-xl mx-auto">
            <SfcLeadCaptureForm
              source="contact"
              heading="Or Leave Your Info — We'll Call You"
              ctaLabel="Request a Callback"
            />
          </div>
        </section>
      </main>

      <SfcTrustBar showEstimateDisclaimer={false} />
    </>
  );
}
