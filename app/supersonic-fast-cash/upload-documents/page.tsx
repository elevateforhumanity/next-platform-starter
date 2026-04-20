import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Upload Tax Documents | Supersonic Fast Cash',
};

export default function UploadDocumentsPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-7.jpg"
        alt="Upload your tax documents securely"
        title="Upload Your Tax Documents"
        subtitle="Send your documents to your preparer securely — no office visit required."
      />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Secure Document Submission</h2>
          <p className="text-slate-600 leading-relaxed">
            You can submit your tax documents to your assigned preparer by email or by calling our office
            to be connected to our secure file-sharing portal. All files are encrypted and accessible
            only to your preparer and the compliance officer.
          </p>
        </section>

        <div className="bg-brand-blue-900 text-white rounded-2xl p-8">
          <h3 className="font-black text-lg mb-3">Submit Your Documents</h3>
          <p className="text-blue-200 leading-relaxed mb-6">
            Email your documents directly to your preparer at the address below, or call us and we will
            walk you through the secure upload process step by step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:documents@supersonicfastcash.com"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Email Documents
            </a>
            <a
              href="tel:3173143757"
              className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center"
            >
              Call (317) 314-3757
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Documents to Include</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'W-2 forms from every employer you worked for during the year',
              '1099 forms (freelance income, interest, dividends, retirement distributions)',
              'Photo ID — driver\'s license or state ID',
              'Social Security cards for yourself, your spouse, and all dependents',
              'Last year\'s tax return (if available)',
              'Any IRS notices or letters you received this year',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Accepted File Formats</h2>
          <p className="text-slate-600">
            PDF, JPG, PNG, and HEIC (iPhone photos). Maximum file size: 20 MB per document. If your
            file is larger, call us and we will arrange an alternative transfer method.
          </p>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/start"
            className="text-brand-red-600 hover:underline font-semibold"
          >
            Not ready to upload? Start your return online →
          </Link>
        </div>
      </div>
    </>
  );
}
