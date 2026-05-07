'use client';

import Link from 'next/link';
import Image from 'next/image';

const PROGRAMS = [
  {
    tag: 'Healthcare',
    full: 'Certified Nursing Assistant',
    duration: '6 weeks',
    salary: '$30–$42K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    image: '/images/pages/programs-cna-hero.jpg',
    objectPosition: 'center 20%',
    href: '/programs/cna',
    applyHref: '/programs/cna/apply',
    price: null, // funded — no price shown
  },
  {
    tag: 'Certification',
    full: 'HVAC Certification',
    duration: '6 weeks',
    salary: '$40–$80K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    image: '/images/pages/programs-hvac-hero.jpg',
    objectPosition: 'center center',
    href: '/programs/hvac-technician',
    applyHref: '/programs/hvac-technician/apply',
    price: null,
  },
  {
    tag: 'Transportation',
    full: 'CDL Class A',
    duration: 'Weeks, not years',
    salary: '$50–$80K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    image: '/images/pages/programs-cdl-hero.jpg',
    objectPosition: 'center center',
    href: '/programs/cdl-training',
    applyHref: '/apply?program=cdl-training',
    price: null,
  },
  {
    tag: 'Apprenticeship',
    full: 'Barber Apprenticeship',
    duration: '15–17 months',
    salary: '$35–$65K+/yr',
    funding: 'Self-Pay · Funding May Apply',
    fundingColor: 'text-yellow-300',
    image: '/images/pages/programs-barber-hero-new.jpg',
    objectPosition: 'center 15%',
    href: '/programs/barber-apprenticeship',
    applyHref: '/programs/barber-apprenticeship/apply',
    price: '$4,980',
  },
];

function ProgramCard({ prog, priority }: { prog: (typeof PROGRAMS)[number]; priority?: boolean }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden" style={{ aspectRatio: '9/14' }}>
      {/* Background image — not a link, avoids nested <a> */}
      <Image
        src={prog.image}
        alt={prog.full}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ objectPosition: prog.objectPosition }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        priority={priority}
        loading={priority ? undefined : 'lazy'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-1">
            {prog.tag}
          </p>
          <h3 className="font-extrabold text-white text-base leading-snug">{prog.full}</h3>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-slate-300">{prog.duration}</p>
            <p className="text-sm font-bold text-green-400">{prog.salary}</p>
            <p className={`text-xs font-semibold ${prog.fundingColor}`}>{prog.funding}</p>
          </div>
        </div>

        {/* CTA buttons — flat links, no nesting */}
        <div className="flex flex-col gap-2">
          <Link
            href={prog.applyHref}
            className="w-full text-center py-2 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold transition-colors"
          >
            {prog.price ? `Enroll · ${prog.price}` : 'Apply Now'}
          </Link>
          <Link
            href={prog.href}
            className="w-full text-center py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            View Program →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProgramVideoCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {PROGRAMS.map((prog, i) => (
        <ProgramCard key={prog.full} prog={prog} priority={i === 0} />
      ))}
    </div>
  );
}
