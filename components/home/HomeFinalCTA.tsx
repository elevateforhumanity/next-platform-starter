/**
 * HomeFinalCTA
 *
 * Strong workforce transformation close.
 * Primary: Apply. Secondary: Check Eligibility.
 * Phone number for direct contact.
 */

import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function HomeFinalCTA() {
  return (
    <section
      className="relative bg-brand-red-700 py-12 sm:py-14 px-4 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">
          Ready to start?
        </p>
        <h2
          id="final-cta-heading"
          className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight"
        >
          From where you are
          <br />
          to where you want to be.
        </h2>
        <p className="text-red-50 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
          Apply once. Get connected to training, funding, apprenticeship, certification,
          and employment — all in one system.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/check-eligibility"
            className="inline-flex items-center justify-center gap-2 border-2 border-white/70 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            Check Eligibility
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white text-xs">
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
            className="inline-flex items-center gap-1.5 text-white font-bold hover:text-red-50 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            {PLATFORM_DEFAULTS.supportPhone}
          </a>
          <span className="hidden sm:block text-red-100" aria-hidden="true">·</span>
          <span>Call or text — Mon–Fri, 9am–5pm ET</span>
          <span className="hidden sm:block text-red-100" aria-hidden="true">·</span>
          <Link href="/contact" className="text-white font-semibold underline underline-offset-2 hover:text-red-50 transition-colors">
            Send a message
          </Link>
        </div>
      </div>
    </section>
  );
}
