'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ProgramSchema } from '@/lib/programs/program-schema';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

interface BeautyProgramPageProps {
  program: ProgramSchema;
}

// Shared section wrapper with consistent padding
function Section({ children, className = '', bg = '' }: { children: React.ReactNode; className?: string; bg?: string }) {
  return (
    <section className={`py-16 px-4 ${bg} ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

// Animated card for How It Works
function PhaseCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur"
    >
      <div className="w-12 h-12 bg-brand-red-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">
        {step}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
    </motion.div>
  );
}

// Program card for related programs
function ProgramCard({ slug, title, desc, image, isActive }: { slug: string; title: string; desc: string; image: string; isActive: boolean }) {
  return (
    <Link href={`/programs/${slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={`bg-white rounded-xl border overflow-hidden transition ${
          isActive ? 'border-brand-red-600 shadow-lg' : 'border-slate-200 hover:shadow-xl'
        }`}
      >
        <div className="aspect-video bg-slate-100 relative overflow-hidden">
          <Image src={image} alt={title} fill className="object-cover" />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{desc}</p>
          {isActive && (
            <span className="inline-block mt-2 text-xs font-bold text-brand-red-600 bg-red-50 px-2 py-1 rounded">
              Current
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function BeautyProgramPage({ program }: BeautyProgramPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const programType = program.slug.includes('barber') ? 'barber'
    : program.slug.includes('cosmetology') ? 'cosmetology'
    : program.slug.includes('esthetician') ? 'esthetician'
    : 'nail';

  const typeLabels: Record<string, string> = {
    barber: 'Barbering',
    cosmetology: 'Cosmetology',
    esthetician: 'Esthetics',
    nail: 'Nail Technology'
  };

  const hero = heroBanners.programs?.[program.slug] || heroBanners.home;

  const relatedPrograms = [
    { slug: 'barber-apprenticeship', title: 'Barbering', desc: 'Launch your career', image: '/images/pages/barber-hero-main.webp' },
    { slug: 'cosmetology-apprenticeship', title: 'Cosmetology', desc: 'Professional techniques', image: '/images/pages/cosmetology-hero.webp' },
    { slug: 'esthetician-apprenticeship', title: 'Esthetics', desc: 'Skin care', image: '/images/pages/esthetician-hero.webp' },
    { slug: 'nail-technician-apprenticeship', title: 'Nail Technology', desc: 'Nail artistry', image: '/images/pages/nail-tech-hero.webp' },
  ];

  const faqs = [
    { q: 'How long does the apprenticeship take?', a: '12-18 months. Complete 2,000 hours of on-the-job training and related technical instruction.' },
    { q: 'Do I get paid during training?', a: 'Yes! Earn while you learn with competitive wages from day one.' },
    { q: 'What are the requirements?', a: 'High school diploma or GED, be 16+ years old, and interest in the beauty industry.' },
    { q: 'Can I get financial assistance?', a: 'Yes! WIOA, Workforce Ready Grant, JRI, and VA Benefits accepted.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero - Clean, no overlays */}
      <HeroVideo
        videoSrcDesktop={hero.videoSrcDesktop || hero.videoSrcMobile || ''}
        videoSrcMobile={hero.videoSrcMobile || hero.videoSrcDesktop || ''}
        posterImage={hero.posterImage}
        microLabel="DOL Registered Apprenticeship"
        belowHeroHeadline={`${typeLabels[programType]} Apprenticeship`}
        belowHeroSubheadline="Earn while you learn. Get licensed. Launch your career."
        ctas={[
          { label: 'Apply Now', href: `/programs/${program.slug}/apply` },
          { label: 'Explore Funding', href: '/funding', variant: 'secondary' },
        ]}
        trustIndicators={[
          'RAPIDS Sponsor ID: 2025-IN-132301',
          'WIOA Title I Approved',
          '2,000 Training Hours',
        ]}
      />

      {/* Stats Bar */}
      <Section bg="bg-brand-blue-700 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold">{program.durationWeeks || 52} weeks</div>
            <div className="text-blue-200 text-sm mt-1">Program Duration</div>
          </div>
          <div>
            <div className="text-3xl font-bold">2,000</div>
            <div className="text-blue-200 text-sm mt-1">Training Hours</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{program.credentials?.length || 2}+</div>
            <div className="text-blue-200 text-sm mt-1">Credentials</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{program.tuition || '$4,980'}</div>
            <div className="text-blue-200 text-sm mt-1">Program Cost</div>
          </div>
        </div>
      </Section>

      {/* Mission Quote */}
      <Section bg="bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">Our Mission</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-6">{typeLabels[programType]} Program</h2>
          <blockquote className="text-xl text-slate-600 italic leading-relaxed border-l-4 border-brand-red-600 pl-6 text-left">
            "It is the Mission of Elevate to provide our students with a safe, positive learning environment, 
            to successfully prepare them for the state board, and to be professionals in the {typeLabels[programType].toLowerCase()} industry."
          </blockquote>
        </div>
      </Section>

      {/* Overview + Credentials */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">Program Overview</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-6">Launch Your Career in {typeLabels[programType]}</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Our {typeLabels[programType]} apprenticeship combines hands-on training at licensed 
              establishments with structured classroom instruction. Earn while you learn.
            </p>
            <ul className="space-y-3 mb-8">
              {['Earn wages while completing training', 'State-licensed instructors', '98% license exam pass rate', 'Career placement support'].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-red-500"></span>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link href={`/programs/${program.slug}/apply`} className="bg-brand-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-red-700 transition">
                Apply Now
              </Link>
              <Link href="/funding" className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold hover:bg-slate-50 transition">
                Explore Funding
              </Link>
            </div>
          </div>
          <div className="bg-slate-100 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Credentials</h3>
            <div className="space-y-4">
              {(program.credentials || ['State License', 'DOL Certificate']).map((cred, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg"
                >
                  <div className="w-12 h-12 bg-brand-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{cred}</p>
                    <p className="text-sm text-slate-500">Industry recognized</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <Section bg="bg-slate-900">
        <div className="text-center mb-12">
          <p className="text-brand-red-400 font-bold text-sm uppercase tracking-widest">How It Works</p>
          <h2 className="text-3xl font-bold text-white mt-4">Earn While You Learn</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Apply & Enroll', desc: 'Submit application. Get matched with host salon.' },
            { step: '02', title: 'On-the-Job Training', desc: 'Work in licensed salon. Earn wages.' },
            { step: '03', title: 'Classroom Instruction', desc: 'Complete Related Technical Instruction.' },
            { step: '04', title: 'Get Licensed', desc: 'Pass state exam. Launch career.' },
          ].map((item) => (
            <PhaseCard key={item.step} {...item} />
          ))}
        </div>
      </Section>

      {/* Related Programs */}
      <Section>
        <div className="text-center mb-12">
          <p className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">Explore Programs</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-4">Our Beauty Programs</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {relatedPrograms.map((p) => (
            <ProgramCard key={p.slug} {...p} isActive={p.slug === program.slug} />
          ))}
        </div>
      </Section>

      {/* Funding */}
      <Section bg="bg-brand-blue-50 border-y border-brand-blue-100">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-blue-600 font-bold text-sm uppercase tracking-widest">Financial Assistance</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-6">Funding May Cover Your Training</h2>
            <p className="text-slate-600 mb-6">
              Most eligible learners qualify for $0 tuition through workforce funding programs.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['WIOA', 'Workforce Ready Grant', 'JRI', 'VA Benefits'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green-500"></span>
                  <span className="text-slate-700 font-medium">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/funding" className="inline-flex items-center gap-2 mt-8 text-brand-blue-600 font-bold hover:underline">
              Check eligibility →
            </Link>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Self-Pay Options</h3>
            <div className="text-center mb-6">
              <span className="text-sm text-slate-500">Total Program Cost</span>
              <div className="text-4xl font-bold text-brand-red-600">{program.tuition || '$4,980'}</div>
            </div>
            <div className="flex justify-between text-slate-600 mb-3">
              <span>Payment Plan</span>
              <span className="font-medium">Available</span>
            </div>
            <div className="flex justify-between text-slate-600 mb-6">
              <span>BNPL Options</span>
              <span className="font-medium">Available</span>
            </div>
            <Link href={`/programs/${program.slug}/payment/bnpl`} className="block w-full text-center bg-brand-red-600 text-white py-3 rounded-lg font-bold hover:bg-brand-red-700 transition">
              Calculate Payments
            </Link>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">FAQ</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-4">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition"
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <svg className={`w-5 h-5 text-slate-400 transition ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section bg="bg-brand-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Career?</h2>
          <p className="text-xl text-red-100 mb-8">Apply once for training, funding, and career support.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/programs/${program.slug}/apply`} className="bg-white text-brand-red-700 px-8 py-4 rounded-lg font-bold hover:bg-red-50 transition">
              Apply Now
            </Link>
            <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition">
              Contact Us
            </Link>
          </div>
          <p className="text-sm text-red-200 mt-6">(317) 314-3757 · Mon–Fri, 9am–5pm ET</p>
        </div>
      </Section>
    </div>
  );
}
