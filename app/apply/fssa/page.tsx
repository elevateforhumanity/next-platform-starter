import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import FssaApplicationForm from './FssaApplicationForm';

export const metadata: Metadata = {
  title: 'Apply — FSSA IMPACT Program | Elevate for Humanity',
  description:
    'Apply for free workforce training through Indiana\'s FSSA IMPACT program. SNAP and TANF recipients may qualify for fully funded career training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/apply/fssa' },
};

export default function FssaApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'FSSA IMPACT' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-green-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            FSSA IMPACT — Free Training
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
            Apply for FSSA IMPACT Funded Training
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl">
            Indiana&apos;s FSSA IMPACT program provides fully funded workforce training for SNAP
            and TANF recipients. No Microsoft account needed — complete your application here.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <span>✓ No cost to eligible participants</span>
            <span>✓ Takes about 10 minutes</span>
            <span>✓ No account required</span>
          </div>
        </div>
      </section>

      {/* Eligibility callout */}
      <section className="bg-green-50 border-b border-green-100 py-4 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-6 text-sm">
          <div>
            <span className="font-bold text-green-800">Who qualifies:</span>
            <span className="text-green-700 ml-2">Indiana residents currently receiving SNAP or TANF benefits</span>
          </div>
          <div>
            <span className="font-bold text-green-800">Questions?</span>
            <span className="text-green-700 ml-2">Call us: <a href="tel:+13175594999" className="underline">(317) 559-4999</a></span>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 px-6">
        <FssaApplicationForm />
      </section>
    </div>
  );
}
