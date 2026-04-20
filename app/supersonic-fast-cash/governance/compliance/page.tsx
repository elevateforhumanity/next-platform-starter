import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Tax Compliance Standards | Supersonic Fast Cash',
};

export default function CompliancePage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Tax compliance standards"
        title="Tax Compliance Standards"
        subtitle="Our compliance framework meets or exceeds IRS and Indiana state requirements."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">PTIN Requirements</h2>
          <p className="text-slate-600 leading-relaxed">
            All tax return preparers at Supersonic Fast Cash hold an active IRS Preparer Tax
            Identification Number (PTIN) as required under IRC § 6109(a)(4). PTINs are renewed annually
            and verified before each filing season. Sub-office partners must maintain an active PTIN as a
            condition of their agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">IRS Authorized e-File Provider</h2>
          <p className="text-slate-600 leading-relaxed">
            Supersonic Fast Cash LLC is an IRS Authorized e-File Provider holding an active Electronic
            Filing Identification Number (EFIN). This designation is granted only after IRS suitability
            checks, including a credit and criminal background review. Our EFIN authorizes us to
            electronically submit returns to the IRS on behalf of clients.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">State Registration</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            We are registered to prepare and file state income tax returns in Indiana. Our preparers
            follow Indiana Department of Revenue requirements for electronic filing, client data
            handling, and record retention.
          </p>
          <ul className="space-y-2 text-slate-600">
            {[
              'Registered business entity with the Indiana Secretary of State',
              'Indiana DOR-compliant e-file procedures',
              'Annual compliance review before each filing season',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
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
