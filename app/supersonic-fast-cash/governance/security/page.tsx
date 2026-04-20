import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Security Standards | Supersonic Fast Cash',
};

export default function SecurityPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Security standards"
        title="Security Standards"
        subtitle="How we protect your sensitive tax and financial information."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Encryption</h2>
          <p className="text-slate-600 leading-relaxed">
            All client data — including SSNs, income records, and banking information — is encrypted
            using AES-256 encryption, both in transit (TLS 1.2+) and at rest. This is the same standard
            used by financial institutions and federal agencies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Secure Servers & Access Controls</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'Client data stored on access-controlled servers in US-based data centers',
              'Role-based access: preparers see only the clients assigned to them',
              'Multi-factor authentication required for all staff portal access',
              'Automatic session timeouts after periods of inactivity',
              'All access is logged and auditable by the compliance officer',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Handling Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            We never sell, rent, or trade client data. Paper documents are shredded after digitization.
            Digital records are retained for the IRS-required three-year period and then securely deleted.
            Staff complete annual security awareness training as a condition of employment.
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
