import Link from 'next/link';

const STEPS = [
  {
    title: 'Apply (free)',
    detail:
      'Submit the apprentice application. There is no tuition charge at this step — we review readiness and funding options with you.',
  },
  {
    title: 'Host shop match',
    detail:
      'We place you with a licensed Indiana barbershop for on-the-job training (OJT). You earn wages while you learn in the chair.',
  },
  {
    title: 'RTI + daily theory',
    detail:
      'Complete Related Technical Instruction online (500 hours). Pass the daily theory quiz (70% minimum) before OJT hours count for credit.',
  },
  {
    title: '2,000 hours & checkpoints',
    detail:
      'Track 1,500 OJT hours at your host shop plus 500 RTI hours. Supervisors sign off competencies as you progress through each module.',
  },
  {
    title: 'State exam & license',
    detail:
      'When hours and RTI are complete, sit for the Indiana Barber License written and practical exams. Graduate with a DOL apprenticeship certificate.',
  },
] as const;

export default function BarberApprenticeshipProcess() {
  return (
    <section className="py-12 border-t border-slate-100 bg-white" id="how-it-works">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">
          How it works
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          From application to licensed barber
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl mb-8">
          This is a <strong>52-week DOL registered apprenticeship</strong> — not a short course.
          You train on the shop floor, study online, and move toward Indiana licensure with a
          clear step-by-step path.
        </p>
        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-slate-600">
          Self-pay tuition is <strong>$4,980</strong> when workforce funding does not apply — use the{' '}
          <Link href="#payment-calculator" className="font-semibold text-brand-blue-600 hover:underline">
            payment calculator
          </Link>{' '}
          below for deposit and weekly plan options, or{' '}
          <Link
            href="/programs/barber-apprenticeship/payment/bnpl"
            className="font-semibold text-brand-blue-600 hover:underline"
          >
            compare BNPL providers
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
