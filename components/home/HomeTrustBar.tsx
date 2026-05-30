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
    sub: 'Apprenticeship Sponsor',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/partners/dwd.webp',
    label: 'ETPL Approved',
    sub: 'Indiana DWD Eligible Provider',
    href: '/federal-compliance',
  },
  {
    img: '/images/partners/dwd.webp',
    label: 'WIOA Aligned',
    sub: 'Title I & II Compliant',
    href: '/eligibility',
  },
  {
    img: '/images/partners/nextleveljobs.webp',
    label: 'RAPIDS Tracked',
    sub: 'DOL Apprenticeship System',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/partners/workone.webp',
    label: 'WorkOne Partner',
    sub: 'Indiana DWD Aligned',
    href: '/partners/workforce',
  },
  {
    img: '/images/partners/workone.webp',
    label: 'JRI Approved',
    sub: 'Marion County Funding',
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
      {/* Credential badges — 2 cols mobile, 3 cols sm, 6 cols lg */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-4">
          Accreditations &amp; Approvals
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TRUST_ITEMS.map(({ img, label, sub, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-blue-200 hover:bg-brand-blue-50 transition-colors text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                <Image
                  src={img}
                  alt={label}
                  width={36}
                  height={36}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-brand-blue-700">{label}</p>
                <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Partner logos */}
      <div className="border-t border-slate-100 py-5 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-4">
            Aligned with workforce development partners
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {PARTNER_LOGOS.map((logo) => (
              <Link
                key={logo.src}
                href={logo.href}
                aria-label={logo.alt}
                className="relative h-8 w-24 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  sizes="96px"
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
