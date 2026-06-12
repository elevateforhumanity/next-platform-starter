import { Metadata } from 'next';
import Link from 'next/link';
import { hero as heroTokens } from '@/lib/page-design-tokens';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

const p = ESTHETICIAN_APPRENTICESHIP;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Esthetician Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/esthetician-apprenticeship' },
};

export default async function EstheticianApprenticeshipPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className={`${heroTokens.imageWrap} w-full overflow-hidden`}>
        <img
          src={p.heroImage}
          alt={p.heroImageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: p.title }]} />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 mt-4">{p.title}</h1>
          <p className="text-slate-600 mb-6 max-w-2xl">{p.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/programs/esthetician-apprenticeship/apply"
              className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs/esthetician-apprenticeship/host-shops"
              className="inline-block px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Find a Host Shop
            </Link>
          </div>
        </div>
      </div>
      
      {/* Program details placeholder - full implementation would include ProgramDetailPage */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="prose max-w-3xl">
          <h2>About This Program</h2>
          <p>{p.subtitle}</p>
          <h3>Duration</h3>
          <p>{p.durationWeeks} weeks at {p.hoursPerWeekMin}–{p.hoursPerWeekMax} hours/week</p>
          <h3>Schedule</h3>
          <p>{p.schedule}</p>
        </div>
        
        {/* Quick links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-2">Apply</h3>
            <p className="text-slate-600 text-sm mb-4">Start your esthetician apprenticeship today.</p>
            <Link href="/programs/esthetician-apprenticeship/apply" className="text-brand-blue-600 hover:underline font-medium">
              Apply Now →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-2">Find a Host Shop</h3>
            <p className="text-slate-600 text-sm mb-4">Connect with licensed spas and salons.</p>
            <Link href="/programs/esthetician-apprenticeship/host-shops" className="text-brand-blue-600 hover:underline font-medium">
              View Host Shops →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-2">Funding Options</h3>
            <p className="text-slate-600 text-sm mb-4">Learn about payment plans and funding.</p>
            <Link href="/funding" className="text-brand-blue-600 hover:underline font-medium">
              View Funding →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
