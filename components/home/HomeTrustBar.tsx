/**
 * HomeTrustBar
 *
 * Institutional validation strip — DOL registration, WIOA/ETPL approval,
 * RAPIDS tracking, JRI funding, WorkOne alignment. Each badge links to
 * the relevant proof/detail page. Static, server-renderable.
 */

import Image from 'next/image';
import Link from 'next/link';

const TRUST_ITEMS = [
  {
    img: '/images/partners/usdol.webp',
    label: 'DOL Registered',
    sub: 'Federal apprenticeship sponsor',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/partners/dwd.webp',
    label: 'ETPL Approved',
    sub: 'WIOA-funded tuition eligible',
    href: '/federal-compliance',
  },
  {
    img: '/images/partners/dwd.webp',
    label: 'WIOA Aligned',
    sub: 'Title I & II compliant',
    href: '/eligibility',
  },
  {
    img: '/images/partners/usdol.webp',
    label: 'RAPIDS Tracked',
    sub: 'DOL apprenticeship system',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/partners/workone.webp',
    label: 'WorkOne Partner',
    sub: 'Indiana DWD aligned',
    href: '/partners/workforce',
  },
  {
    img: '/images/partners/nextleveljobs.webp',
    label: 'JRI Approved',
    sub: 'Marion County free tuition',
    href: '/partners/jri',
  },
];

const PARTNER_LOGOS = [
  { src: '/images/partners/usdol.webp', alt: 'US Department of Labor', href: '/federal-compliance' },
  { src: '/images/partners/dwd.webp', alt: 'Indiana Department of Workforce Development', href: '/partners/workforce' },
  { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana', href: '/partners/workforce' },
  { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs', href: '/eligibility' },
  { src: '/images/partners/osha.webp', alt: 'OSHA Authorized', href: '/compliance' },
];

export function HomeTrustBar() {
  return (
    <section
      className="bg-white border-b border-slate-100"
      aria-label="Institutional credentials and partnerships"
    >
      {/* Credential badges — 3 col mobile, 6 col desktop */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">
          Accreditations &amp; Approvals
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {TRUST_ITEMS.map(({ img, label, sub, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 px-2 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-blue-200 hover:bg-brand-blue-50 transition-colors group text-center"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                <Image
                  src={img}
                  alt={label}
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-brand-blue-700">{label}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 hidden sm:block">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Partner logos */}
      <div className="border-t border-slate-100 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">
            Aligned with workforce development partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {PARTNER_LOGOS.map((logo) => (
              <Link
                key={logo.src}
                href={logo.href}
                aria-label={logo.alt}
                className="relative h-9 w-28 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  sizes="112px"
                  loading="lazy"
                  placeholder="empty"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
