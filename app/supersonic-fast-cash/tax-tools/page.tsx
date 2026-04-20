import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const toolCards = [
  {
    title: 'Refund Calculator',
    desc: 'Estimate your federal refund or amount owed before you file — no login required.',
    href: '/supersonic-fast-cash/calculator',
    cta: 'Open Calculator',
  },
  {
    title: 'Upload Your Documents',
    desc: 'Securely upload your W-2s, 1099s, and other tax documents for your preparer to review.',
    href: '/supersonic-fast-cash/upload-documents',
    cta: 'Upload Now',
  },
  {
    title: 'Refund Tracker',
    desc: 'Check the status of your federal refund using your SSN and filing date.',
    href: '/supersonic-fast-cash/tools/refund-tracker',
    cta: 'Track My Refund',
  },
  {
    title: 'Tax Document Checklist',
    desc: 'Download or view the complete list of documents to bring to your appointment.',
    href: '#checklist',
    cta: 'View Checklist',
  },
];

const checklist = [
  'W-2 forms from all employers',
  '1099 forms (1099-NEC, 1099-MISC, 1099-INT, 1099-DIV, 1099-R)',
  'Social Security card (or Social Security number for all household members)',
  'Government-issued photo ID',
  'Prior year tax return (if available)',
  'Bank routing and account numbers for direct deposit',
  'Mortgage interest statement (Form 1098)',
  'Student loan interest statement (Form 1098-E)',
  'Medical expense receipts (if itemizing deductions)',
  'Childcare provider name, address, and Tax ID (if claiming dependent care credit)',
  'Health insurance 1095-A, 1095-B, or 1095-C forms',
  'Business income and expense records (if self-employed)',
];

export default function TaxToolsPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-4.jpg"
        alt="Tax tools and resources at Supersonic Fast Cash"
        title="Free Tax Tools & Resources"
        subtitle="Checklists, guides, and calculators to help you file with confidence."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Tool cards */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Tools Available to You</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {toolCards.map(({ title, desc, href, cta }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">{desc}</p>
                <Link
                  href={href}
                  className="mt-4 inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors self-start"
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Inline checklist */}
        <section id="checklist" className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tax Document Checklist</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Bring or upload the following documents to ensure your return is prepared accurately and completely.
          </p>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-500">
            Not sure if a document applies to you?{' '}
            <Link href="/supersonic-fast-cash/contact" className="text-brand-red-600 hover:underline font-medium">
              Contact us
            </Link>{' '}
            and a preparer will help you figure it out.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="bg-brand-blue-900 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Ready to File?</h2>
          <p className="text-blue-200 mb-8">Our PTIN-certified preparers are ready to handle the rest.</p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors"
          >
            Start My Return
          </Link>
        </section>

      </main>
    </>
  );
}
