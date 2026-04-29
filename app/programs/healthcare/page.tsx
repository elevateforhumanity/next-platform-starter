import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { createPublicClient } from '@/lib/supabase/public';
import { programs as staticPrograms } from '@/content/cf-programs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | CNA, Phlebotomy, Medical Assistant | Elevate for Humanity',
  description:
    'State-approved healthcare training in Indianapolis. CNA, Phlebotomy, Medical Assistant, Pharmacy Tech and more. Funding available through FSSA IMPACT and WIOA depending on program.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/healthcare' },
};

const programImages: Record<string, string> = {
  cna: '/images/healthcare/hero-program-patient-care.jpg',
  'cna-cert': '/images/healthcare/hero-program-patient-care.jpg',
  'direct-support-professional': '/images/healthcare/hero-program-medical-assistant.jpg',
  'drug-collector': '/images/healthcare/hero-program-phlebotomy.jpg',
  'medical-assistant': '/images/healthcare/hero-program-medical-assistant.jpg',
  'phlebotomy-technician': '/images/healthcare/hero-program-phlebotomy.jpg',
  'pharmacy-technician': '/images/healthcare/hero-program-medical-assistant.jpg',
  default: '/images/healthcare/hero-program-patient-care.jpg',
};

const HEALTHCARE_SLUGS = [
  'cna','medical-assistant','phlebotomy','home-health-aide',
  'peer-recovery-specialist','pharmacy-technician','direct-support-professional',
  'drug-collector','sanitation-infection-control','cpr-first-aid','emergency-health-safety',
];

interface ProgramCard { slug: string; title: string; description: string; }

async function getHealthcarePrograms(): Promise<ProgramCard[]> {
  try {
    const db = createPublicClient();
    if (db) {
      const { data } = await db
        .from('programs')
        .select('slug, title, short_description, description')
        .eq('category', 'healthcare')
        .eq('published', true)
        .order('title');
      if (data && data.length > 0) {
        const seen = new Set<string>();
        return data
          .filter((p) => HEALTHCARE_SLUGS.includes(p.slug))
          .filter((p) => { const k = p.title.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; })
          .map((p) => ({ slug: p.slug, title: p.title, description: p.short_description || p.description || '' }));
      }
    }
  } catch { /* fall through */ }
  return staticPrograms
    .filter((p) => HEALTHCARE_SLUGS.includes(p.slug))
    .map((p) => ({ slug: p.slug, title: p.title, description: p.description || '' }));
}

export default async function HealthcareProgramsPage() {
  const programs = await getHealthcarePrograms();
  const b = heroBanners['healthcare'] ?? {
    videoSrcDesktop: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/cna-hero.mp4',
    posterImage: '/images/pages/healthcare-hero.jpg',
    microLabel: 'Healthcare Programs',
    analyticsName: 'healthcare',
    belowHeroHeadline: 'Healthcare Careers — Certified, credentialed, job-ready.',
    belowHeroSubheadline: 'CNA, Phlebotomy, Medical Assistant, Pharmacy Tech and more.',
    primaryCta: { label: 'Apply Now', href: '/apply?program=healthcare' },
    secondaryCta: { label: 'Check Eligibility', href: '/check-eligibility', variant: 'secondary' as const },
    trustIndicators: ['Free with WIOA funding','State-approved curricula','Clinical rotations included','Job placement assistance'],
    transcript: '',
  };

  const ctas = [b.primaryCta, ...('secondaryCta' in b && b.secondaryCta ? [b.secondaryCta] : [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop={b.videoSrcDesktop}
        posterImage={b.posterImage}
        voiceoverSrc={'voiceoverSrc' in b ? (b as { voiceoverSrc?: string }).voiceoverSrc : undefined}
        microLabel={b.microLabel}
        analyticsName={b.analyticsName}
        belowHeroHeadline={b.belowHeroHeadline}
        belowHeroSubheadline={b.belowHeroSubheadline}
        ctas={ctas}
        trustIndicators={'trustIndicators' in b ? b.trustIndicators : undefined}
        transcript={'transcript' in b ? (b as { transcript?: string }).transcript : undefined}
      />
      <Breadcrumbs />
      <PathwayDisclosure programName="Healthcare" programSlug="healthcare" />

      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Healthcare Programs</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Choose Your Healthcare Path</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">All programs are free for eligible participants through WIOA funding.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image src={programImages[program.slug] ?? programImages['default']} alt={program.title}
                    fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{program.title}</h3>
                  {program.description && <p className="text-slate-600 text-sm mb-3 line-clamp-2">{program.description}</p>}
                  <span className="text-blue-600 font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">Learn More <span aria-hidden>→</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Career Outcomes</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Healthcare is one of the fastest-growing industries with strong job security.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{stat:'$15–$22',label:'Starting hourly wage for CNAs'},{stat:'90%+',label:'Job placement rate'},{stat:'4–8 wks',label:'Typical program duration'},{stat:'High',label:'Demand for healthcare workers'}].map(({stat,label})=>(
              <div key={stat} className="text-center">
                <div className="text-5xl font-black text-white mb-2">{stat}</div>
                <p className="text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Healthcare Career?</h2>
          <p className="text-blue-100 mb-8">Apply today and find out if you qualify for free training through WIOA funding.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply?program=healthcare" className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition">Apply Now</Link>
            <Link href="/check-eligibility" className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition">Check Eligibility</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
