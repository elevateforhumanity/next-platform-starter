export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const states = [
  {
    name: 'Indiana',
    cities: ['Indianapolis (primary location)', 'Bloomington', 'Fort Wayne'],
    slug: 'tax-preparation-indiana',
  },
  {
    name: 'Illinois',
    cities: ['Chicago metro', 'Naperville', 'Rockford'],
    slug: 'tax-preparation-illinois',
  },
  {
    name: 'Ohio',
    cities: ['Columbus', 'Cleveland', 'Cincinnati'],
    slug: 'tax-preparation-ohio',
  },
  {
    name: 'Tennessee',
    cities: ['Nashville', 'Memphis', 'Knoxville'],
    slug: 'tax-preparation-tennessee',
  },
  {
    name: 'Texas',
    cities: ['Dallas', 'Houston', 'San Antonio'],
    slug: 'tax-preparation-texas',
  },
];

export default function LocationsPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/locations-page-1.jpg"
        alt="Tax preparation service areas — Midwest and South"
        title="Tax Preparation Service Areas"
        subtitle="Serving clients across the Midwest and South — in-person and remotely."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* State cards */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Our Service States</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {states.map(({ name, cities, slug }) => (
              <div key={name} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
                <ul className="space-y-1 flex-1">
                  {cities.map((city) => (
                    <li key={city} className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                      <span className="text-slate-600 text-sm">{city}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/supersonic-fast-cash/${slug}`}
                  className="text-sm font-semibold text-brand-red-600 hover:text-brand-red-700 transition-colors"
                >
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Remote services */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-4">Can&rsquo;t Come In?</h2>
          <p className="text-white/80 leading-relaxed mb-6 max-w-2xl">
            We serve clients <span className="text-white font-semibold">nationwide remotely</span>. Secure document upload,
            video consultations, and e-file delivery — everything handled from the comfort of your home.
          </p>
          <ul className="space-y-2">
            {['Secure encrypted document upload', 'Video consultation with your preparer', 'E-file and digital delivery of completed return'].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/supersonic-fast-cash/book-appointment"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Book an Appointment
          </Link>
        </section>
      </main>
    </>
  );
}
