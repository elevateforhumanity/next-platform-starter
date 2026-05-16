import Link from 'next/link';
import Image from 'next/image';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import type { ProgramSchema } from '@/lib/programs/program-schema';

const BADGE_COLORS: Record<string, string> = {
  red: 'bg-brand-red-600 text-white',
  green: 'bg-green-600 text-white',
  blue: 'bg-blue-600 text-white',
  orange: 'bg-orange-500 text-white',
  purple: 'bg-purple-600 text-white',
};

function ProgramCard({ prog, priority }: { prog: ProgramSchema; priority?: boolean }) {
  const applyHref = prog.cta?.applyHref || `/apply?program=${prog.slug}`;
  const programHref = `/programs/${prog.slug}`;
  const badgeClass = BADGE_COLORS[prog.badgeColor ?? 'green'] ?? BADGE_COLORS.green;
  const salary = prog.laborMarket?.salaryRange ?? '';
  const duration = prog.durationWeeks
    ? prog.durationWeeks === 1
      ? '1 week'
      : `${prog.durationWeeks} weeks`
    : '';

  return (
    <div className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-900">
      <Image
        src={prog.heroImage}
        alt={prog.heroImageAlt || prog.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        priority={priority}
        loading={priority ? undefined : 'lazy'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2.5">
        {prog.badge && (
          <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
            {prog.badge}
          </span>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-0.5">
            {prog.category}
          </p>
          <h3 className="font-extrabold text-white text-sm leading-snug">{prog.title}</h3>
          <div className="mt-1 space-y-0.5">
            {duration && <p className="text-xs text-slate-300">{duration}</p>}
            {salary && <p className="text-xs font-bold text-green-400">{salary}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Link
            href={applyHref}
            className="w-full text-center py-2 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold transition-colors"
          >
            Apply Now
          </Link>
          <Link
            href={programHref}
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-10">
      {ALL_PROGRAMS.map((prog, i) => (
        <ProgramCard key={prog.slug} prog={prog} priority={i < 4} />
      ))}
    </div>
  );
}
