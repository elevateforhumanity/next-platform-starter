import { Metadata } from 'next';
import Link from 'next/link';
import MesmerizedApplyForm from './MesmerizedApplyForm';

export const metadata: Metadata = {
  title: 'Mesmerized by Beauty Cosmetology Academy',
  alternates: { canonical: 'https://www.elevateforhumanity.org/schools/mesmerized-by-beauty' },
  description:
    'Apply to Cosmetology, Esthetician, or Nail Technician apprenticeship programs at Mesmerized by Beauty Cosmetology Academy in Indianapolis, IN. WIOA funding available.',
  robots: { index: true, follow: true },
};

const PROGRAMS = [
  {
    title: 'Cosmetology Apprenticeship',
    hours: '2,000 hours',
    credential: 'Indiana IPLA Cosmetology License',
    description:
      'Full cosmetology training covering hair, skin, and nail services. Earn your Indiana state license while working alongside licensed professionals.',
  },
  {
    title: 'Esthetician Apprenticeship',
    hours: '700 hours',
    credential: 'Indiana IPLA Esthetician License',
    description:
      'Skin care, facials, waxing, and advanced esthetic techniques. Prepares you for licensure and employment in spas, salons, and medical settings.',
  },
  {
    title: 'Nail Technician Apprenticeship',
    hours: '400 hours',
    credential: 'Indiana IPLA Nail Technician License',
    description:
      'Manicures, pedicures, nail enhancements, and sanitation standards. One of the fastest paths to a licensed beauty career in Indiana.',
  },
];

export default function MesmerizedByBeautyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-3">
            Partner School · Indianapolis, IN
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
            Mesmerized by Beauty<br />Cosmetology Academy
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mb-8">
            Earn your Indiana cosmetology, esthetician, or nail technician license through an
            apprenticeship program sponsored by Elevate for Humanity. WIOA and Workforce Ready
            Grant funding available for eligible Indiana residents.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#apply" className="bg-white text-purple-900 font-bold px-6 py-3 rounded-xl text-sm hover:bg-purple-50 transition-colors">
              Apply Now
            </a>
            <Link href="/check-eligibility" className="border border-purple-400 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-purple-800 transition-colors">
              Check Funding Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">Programs</p>
        <h2 className="text-3xl font-black text-slate-900 mb-8">Choose your path</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PROGRAMS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{p.title}</h3>
              <p className="text-xs text-purple-600 font-semibold mb-2">{p.hours} · {p.credential}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">Why Mesmerized</p>
          <h2 className="text-3xl font-black text-slate-900 mb-8">What you get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'State License', body: 'Graduate with an Indiana IPLA license — required to work professionally in Indiana.' },
              { title: 'Earn While You Learn', body: 'Apprenticeship model means you can work and train simultaneously.' },
              { title: 'WIOA Funding', body: 'Eligible Indiana residents may qualify for full tuition coverage through WIOA or Workforce Ready Grant.' },
              { title: 'Job Placement', body: 'Elevate connects completers with salons, spas, and employers actively hiring licensed professionals.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2">Get Started</p>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Apply now</h2>
        <p className="text-slate-500 text-sm mb-8">
          Takes about 3 minutes. An advisor will follow up within 1–2 business days to discuss
          your program options and funding eligibility.
        </p>
        <MesmerizedApplyForm />
      </section>

      {/* Footer note */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Mesmerized by Beauty Cosmetology Academy · 8325 Michigan Road · Indianapolis, IN 46268
          </p>
          <p className="text-xs text-slate-400">
            Apprenticeship program sponsored by{' '}
            <Link href="/" className="text-purple-600 hover:underline">Elevate for Humanity</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
