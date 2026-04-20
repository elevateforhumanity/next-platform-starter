import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Operational Controls | Supersonic Fast Cash',
};

export default function OperationalControlsPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Operational controls"
        title="Operational Controls"
        subtitle="How we maintain quality, accuracy, and accountability in every return we prepare."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Preparer Oversight</h2>
          <p className="text-slate-600 leading-relaxed">
            Every tax return prepared at Supersonic Fast Cash is associated with a specific licensed
            preparer identified by their PTIN. Sub-office preparers operate under the supervision of the
            home office compliance officer. All e-filed returns are traceable to the individual preparer
            who prepared them.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Quality Review Process</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'All returns are reviewed for mathematical accuracy before e-filing',
              'Complex returns (self-employment, rental income, multiple states) receive a secondary review',
              'Clients review a printed or digital summary of their return before signing',
              'E-file authorization (Form 8879) must be signed before any return is transmitted',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Error Correction Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            If an error is discovered in a return that was caused by our preparer, we will prepare and
            file an amended return (Form 1040-X) at no additional cost. Clients must report potential
            errors within 3 years of the original filing date. Errors caused by incorrect or incomplete
            information provided by the client are not covered under this policy.
          </p>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/governance"
            className="text-brand-red-600 hover:underline font-semibold"
          >
            ← Back to Governance Overview
          </Link>
        </div>
      </div>
    </>
  );
}
