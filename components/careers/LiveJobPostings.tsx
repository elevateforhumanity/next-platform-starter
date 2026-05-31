import Link from 'next/link';
import { getActiveJobs, formatSalary, jobTypeLabel } from '@/lib/data/jobs';

interface LiveJobPostingsProps {
  heading?: string;
  limit?: number;
  programSlug?: string;
  className?: string;
}

const PROGRAM_JOB_HINTS: Record<string, string[]> = {
  'hvac-technician': ['hvac', 'refrigeration', 'mechanical'],
  'cdl-training': ['cdl', 'truck', 'driver', 'transport'],
  'barber-apprenticeship': ['barber', 'cosmetology', 'salon'],
  cna: ['cna', 'nursing', 'healthcare', 'patient'],
  'it-help-desk': ['it', 'help desk', 'support', 'technician'],
  'it-support-specialist': ['it', 'help desk', 'support', 'technician'],
  'cosmetology-apprenticeship': ['cosmetology', 'salon', 'beauty'],
};

function matchesProgram(job: { title: string; description: string | null }, slug?: string): boolean {
  if (!slug) return true;
  const hints = PROGRAM_JOB_HINTS[slug];
  if (!hints?.length) return true;
  const hay = `${job.title} ${job.description ?? ''}`.toLowerCase();
  return hints.some((h) => hay.includes(h));
}

export default async function LiveJobPostings({
  heading = 'Open positions from employer partners',
  limit = 8,
  programSlug,
  className = '',
}: LiveJobPostingsProps) {
  const all = await getActiveJobs({ limit: 50 });
  const filtered = programSlug
    ? all.filter((j) => matchesProgram(j, programSlug)).slice(0, limit)
    : all.slice(0, limit);
  const jobs = filtered.length > 0 ? filtered : all.slice(0, limit);

  return (
    <section className={`py-12 px-4 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Live job board
            </p>
            <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Active postings from the <code className="text-xs">job_postings</code> table — not a static demo list.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/jobs" className="text-brand-blue-600 font-semibold text-sm hover:underline">
              Full job board →
            </Link>
            <Link href="/careers" className="text-brand-blue-600 font-semibold text-sm hover:underline">
              Elevate careers →
            </Link>
          </div>
        </div>

        {!jobs.length ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-slate-700 font-medium mb-2">No active postings right now</p>
            <p className="text-sm text-slate-600 mb-4">
              Employers post through our hiring portal. Check back soon or contact career services.
            </p>
            <Link
              href="/career-services/contact"
              className="inline-flex items-center justify-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
            >
              Contact career services
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/careers/${job.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-5 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-400 hover:shadow-md transition-all"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600">
                      {[job.location, jobTypeLabel(job.job_type), formatSalary(job)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="text-brand-blue-600 text-sm font-medium shrink-0">View role →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
