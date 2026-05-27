/**
 * HomeTrustBar
 *
 * Institutional validation strip — DOL registration, WIOA alignment,
 * RAPIDS capability, employer partnerships. Static, server-renderable.
 */

import Image from 'next/image';
import { Shield, Award, Users, FileCheck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: Shield,
    label: 'DOL Registered',
    sub: 'Apprenticeship Sponsor',
  },
  {
    icon: FileCheck,
    label: 'WIOA & ETPL',
    sub: 'Approved Provider',
  },
  {
    icon: Award,
    label: 'RAPIDS Compatible',
    sub: 'Apprenticeship Tracking',
  },
  {
    icon: Users,
    label: 'WorkOne Partner',
    sub: 'Indiana DWD Aligned',
  },
];

const PARTNER_LOGOS = [
  { src: '/images/partners/dwd.webp', alt: 'Indiana Department of Workforce Development' },
  { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
  { src: '/images/partners/usdol.webp', alt: 'US Department of Labor' },
  { src: '/images/partners/osha.webp', alt: 'OSHA Authorized' },
  { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
];

export function HomeTrustBar() {
  return (
    <section
      className="bg-white border-b border-slate-100"
      aria-label="Institutional credentials and partnerships"
    >
      {/* Credential badges */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-red-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-red-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">{label}</p>
                <p className="text-[11px] text-slate-500 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner logos */}
      <div className="border-t border-slate-100 py-5 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Aligned with workforce development partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 grayscale opacity-50 hover:opacity-80 transition-opacity duration-300">
            {PARTNER_LOGOS.map((logo) => (
              <div key={logo.src} className="relative h-8 w-24">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  sizes="96px"
                  loading="lazy"
                  placeholder="empty"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
