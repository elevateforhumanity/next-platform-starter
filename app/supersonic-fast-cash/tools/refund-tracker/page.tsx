import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Track Your Tax Refund | Supersonic Fast Cash',
};

export default function RefundTrackerPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-9.jpg"
        alt="Track your tax refund"
        title="Track Your Tax Refund"
        subtitle="Use the IRS online tool to check your refund status in minutes."
      />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How to Check Your Refund</h2>
          <p className="text-slate-600 leading-relaxed mb-5">
            The IRS provides a free online tool called <strong>&quot;Where&apos;s My Refund&quot;</strong> that
            lets you track the status of your federal tax refund. To use it, you will need:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6">
            {[
              'Your Social Security Number or Individual Taxpayer Identification Number',
              'Your filing status (Single, Married Filing Jointly, etc.)',
              'The exact whole-dollar amount of your expected refund',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://www.irs.gov/refunds"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brand-blue-900 hover:opacity-90 text-white font-bold px-8 py-3 rounded-lg transition-opacity"
          >
            Check Refund at IRS.gov ↗
          </a>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Typical Refund Timelines</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="font-black text-3xl text-brand-red-600 mb-1">21 days</p>
              <p className="font-bold text-slate-900 mb-1">E-Filed Returns</p>
              <p className="text-slate-500 text-sm">
                Most e-filed returns with direct deposit are processed within 21 days of IRS acceptance.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="font-black text-3xl text-brand-red-600 mb-1">6 weeks</p>
              <p className="font-bold text-slate-900 mb-1">Paper Returns</p>
              <p className="text-slate-500 text-sm">
                Paper returns take longer to process. Where possible, e-file for a faster refund.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Paper Check Tracking</h2>
          <p className="text-slate-600 leading-relaxed">
            If you requested a paper refund check, the IRS mails it to the address on your return. Once
            mailed, you can use <strong>USPS Informed Delivery</strong> at usps.com to track incoming mail
            and get an estimated delivery date for your check.
          </p>
        </section>

        <div className="bg-brand-red-600 text-white rounded-2xl p-7">
          <h3 className="font-black text-lg mb-2">Refund Delayed Beyond 21 Days?</h3>
          <p className="text-red-100 leading-relaxed mb-4">
            If your e-filed return has been accepted but your refund hasn&apos;t arrived after 21 days,
            call us and we will help you follow up with the IRS.
          </p>
          <a
            href="tel:3173143757"
            className="inline-block bg-white text-brand-red-600 font-black px-6 py-3 rounded-lg hover:bg-red-50 transition-colors"
          >
            Call (317) 314-3757
          </a>
        </div>
      </div>
    </>
  );
}
