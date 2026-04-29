import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/training-providers' },
  title: 'Training Providers | Elevate For Humanity',
  description:
    'Become an approved training provider in the Elevate workforce network. Industry-aligned training with WIOA, WRG, and FSSA compliance support.',
};

const requirements = [
  'Industry-aligned training curriculum',
  'Capacity for student placement and tracking',
  'Reporting capability for WIOA and state funding compliance',
  'Qualified instructors with relevant credentials',
];

const compliance = [
  { label: 'WIOA', desc: 'Workforce Innovation & Opportunity Act requirements' },
  { label: 'Workforce Ready Grant', desc: 'Indiana state-funded training standards' },
  { label: 'FSSA Reporting', desc: 'Indiana Family and Social Services Administration reporting requirements where applicable' },
];

const deliveryModels = [
  { title: 'Elevate-Delivered', desc: 'Training and instruction provided directly by Elevate staff and credentialed instructors.' },
  { title: 'Partner-Delivered', desc: 'Training provided by approved training providers in the Elevate network.' },
  { title: 'Hybrid', desc: 'Classroom instruction through Elevate combined with hands-on training through partner sites.' },
];

export default function TrainingProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'Training Providers' }]} /></div></div>

      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Workforce Training Network</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">Become a Training Provider</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">Join Elevate&apos;s workforce training network. Deliver industry-aligned training to funded participants with full compliance and reporting support.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">Apply to Become a Provider</Link>
            <Link href="/contact" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">Contact Us</Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Delivery Models</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">How Training Is Delivered</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {deliveryModels.map((m) => (
              <div key={m.title} className="rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 text-base mb-2">{m.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12">
          <div>
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">Requirements</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6">Provider Requirements</h2>
            <ul className="space-y-3">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">Funding & Compliance</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6">Compliance Standards</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">Providers must comply with applicable funding source requirements:</p>
            <ul className="space-y-4">
              {compliance.map((c) => (
                <li key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-bold text-slate-900 text-sm mb-1">{c.label}</p>
                  <p className="text-xs text-slate-600">{c.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-brand-red-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Join the Network?</h2>
          <p className="text-red-100 text-sm mb-8">Apply to become an approved training provider or contact us to learn more.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners/apply" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm text-center">Apply to Become a Provider</Link>
            <Link href="/contact" className="border-2 border-white/60 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
