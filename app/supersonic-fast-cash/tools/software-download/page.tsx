import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Tax Software Download | Supersonic Fast Cash',
};

export default function SoftwareDownloadPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-8.jpg"
        alt="Tax software for licensed preparers"
        title="Tax Software Download"
        subtitle="Professional tax preparation software for licensed Supersonic Fast Cash preparers."
      />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Licensed Preparers Only</h2>
          <p className="text-slate-600 leading-relaxed">
            Our desktop tax preparation software is available exclusively to active Supersonic Fast Cash
            licensed tax preparers and sub-office partners. The software includes federal and multi-state
            e-file capabilities, built-in error checking, and direct integration with IRS MeF.
          </p>
        </section>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7">
          <h3 className="font-black text-slate-900 text-lg mb-3">How to Obtain a Licensed Copy</h3>
          <p className="text-slate-600 leading-relaxed mb-5">
            To request your licensed software installation, contact the home office. You will need your
            active PTIN and your signed sub-office agreement on file before access is granted.
          </p>
          <div className="space-y-3">
            <a
              href="tel:3173143757"
              className="flex items-center gap-3 text-slate-700 hover:text-brand-red-600 transition-colors"
            >
              <span className="text-brand-red-600 font-bold">Phone:</span>
              <span>(317) 314-3757</span>
            </a>
            <a
              href="mailto:support@supersonicfastcash.com"
              className="flex items-center gap-3 text-slate-700 hover:text-brand-red-600 transition-colors"
            >
              <span className="text-brand-red-600 font-bold">Email:</span>
              <span>support@supersonicfastcash.com</span>
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">System Requirements</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'Windows 10 or later (64-bit recommended)',
              '4 GB RAM minimum; 8 GB recommended',
              'High-speed internet connection for e-file transmission',
              'PDF reader for return printing and client copies',
            ].map((req) => (
              <li key={req} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/contact"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Contact Us to Get Access
          </Link>
        </div>
      </div>
    </>
  );
}
