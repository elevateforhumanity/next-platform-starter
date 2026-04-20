export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Client Consent & Privacy Authorization | Supersonic Fast Cash',
};

export default function ConsentPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-8.jpg"
        alt="Client privacy and consent"
        title="Client Consent & Privacy Authorization"
        subtitle="We take your privacy seriously. Your information is encrypted, protected, and never sold."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What We Collect</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            To prepare and file your tax return, we collect the following information:
          </p>
          <ul className="space-y-2 text-slate-600">
            {[
              'Full legal name, date of birth, and Social Security Number (SSN)',
              'Income documents: W-2s, 1099s, and other IRS-issued forms',
              'Bank account and routing number for direct deposit of your refund',
              'Prior-year tax return (when applicable)',
              'Dependent information including SSNs and dates of birth',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How We Use Your Information</h2>
          <p className="text-slate-600 leading-relaxed">
            Your information is used exclusively to prepare and electronically file your federal and state
            tax returns with the IRS and applicable state revenue agencies. We do not use your data for
            marketing purposes, and we do not share your information with third parties for their
            marketing use under any circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How We Protect Your Data</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              '256-bit AES encryption for all data stored and transmitted',
              'Secure, access-controlled file storage with role-based permissions',
              'No third-party sale, lease, or transfer of your personal information',
              'Staff background checks and mandatory annual security training',
              'Automatic data deletion after the required IRS retention period',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Rights</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'Request a copy of the data we hold on file for you',
              'Request correction or update of inaccurate information',
              'Request deletion of your data (subject to IRS retention requirements)',
              'Withdraw consent for future tax preparation services at any time',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">IRS Disclosure Requirements</h2>
          <p className="text-slate-600 leading-relaxed">
            As an IRS Authorized e-File Provider, we are required by federal law (IRC § 7216 and IRS
            Circular 230) to retain certain client records for a minimum of <strong>three (3) years</strong>{' '}
            following the date of filing. These records may be subject to IRS audit and review. We comply
            fully with all applicable federal and state record-keeping requirements.
          </p>
        </section>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <p className="text-slate-700 text-sm leading-relaxed italic">
            <strong>Legal Disclaimer:</strong> By filing with Supersonic Fast Cash LLC, you consent to
            the collection, use, and protection of your information as described above.
          </p>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Return to Start
          </Link>
        </div>
      </div>
    </>
  );
}
