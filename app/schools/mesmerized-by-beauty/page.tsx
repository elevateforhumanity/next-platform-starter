import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mesmerized by Beauty | Elevate for Humanity',
  description:
    'Explore Mesmerized by Beauty training pathways, support services, and enrollment options with Elevate for Humanity.',
};

export default function MesmerizedByBeautyPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h1 className="text-4xl font-bold text-slate-900">Mesmerized by Beauty</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-700">
          Launch your beauty career with structured instruction, hands-on practice, and
          career placement support through Elevate for Humanity.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Apply Now
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Request Information
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Program Focus</h2>
            <p className="mt-2 text-slate-700">
              Hair, skin, nails, sanitation, client consultation, and professional business
              skills for salon readiness.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Support Services</h2>
            <p className="mt-2 text-slate-700">
              Career coaching, interview prep, and enrollment guidance with funding navigation
              where eligible.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Outcome Pathway</h2>
            <p className="mt-2 text-slate-700">
              Progress from foundational skills to supervised practice and transition into
              employment opportunities.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-900">How Enrollment Works</h2>
        <ol className="mt-6 space-y-4">
          {[
            'Submit your application and interest details.',
            'Speak with an advisor to confirm fit, schedule, and funding options.',
            'Complete onboarding and begin your training pathway.',
          ].map((step, idx) => (
            <li key={step} className="flex gap-3 rounded-lg border border-slate-200 p-4">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red-600 text-sm font-semibold text-white">
                {idx + 1}
              </span>
              <span className="text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
