export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import { Check } from 'lucide-react';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const tiers = [
  {
    name: 'Simple Return',
    price: '$149',
    highlight: false,
    features: [
      'W-2 income only',
      'Standard deduction',
      'E-file included',
      'Refund advance eligible',
    ],
  },
  {
    name: 'Standard Return',
    price: '$229',
    highlight: true,
    features: [
      'W-2 + 1099 income',
      'Deductions review',
      'Schedule C available',
      'E-file included',
    ],
  },
  {
    name: 'Complex Return',
    price: '$349',
    highlight: false,
    features: [
      'Self-employed filers',
      'Multiple income sources',
      'Itemized deductions',
      'Full audit protection included',
    ],
  },
];

const included = [
  'E-file submission',
  'IRS confirmation number',
  'Refund advance eligibility check',
  'Secure document storage',
  'One year of audit support',
];

export default function PricingPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-2.jpg"
        alt="Tax preparation pricing at Supersonic Fast Cash"
        title="Transparent Tax Preparation Pricing"
        subtitle="No hidden fees. Flat-rate pricing based on your return complexity."
      />

      {/* Pricing tiers */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-8 flex flex-col ${
                  tier.highlight
                    ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-xl scale-105'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                <h3 className={`text-lg font-bold mb-1 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {tier.name}
                </h3>
                <p className={`text-4xl font-black mb-6 ${tier.highlight ? 'text-white' : 'text-brand-red-600'}`}>
                  {tier.price}
                </p>
                <ul className="space-y-3 flex-1 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${tier.highlight ? 'bg-blue-300' : 'bg-brand-red-500'}`} />
                      <span className={`text-sm ${tier.highlight ? 'text-blue-100' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/supersonic-fast-cash/start"
                  className={`block text-center font-bold py-3 rounded-lg transition-colors ${
                    tier.highlight
                      ? 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
                      : 'bg-brand-blue-900 hover:bg-brand-blue-900/90 text-white'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's always included */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What's Always Included</h2>
          <ul className="space-y-4">
            {included.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Refund advance callout */}
      <section className="py-14 bg-brand-blue-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Get Your Refund Today</h2>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Advances up to $7,500 available same day when you file with us.{' '}
            <span className="text-white font-semibold">Zero interest. Zero fees.</span>
          </p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
