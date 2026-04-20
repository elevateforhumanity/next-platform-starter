import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Apply to Become a Tax Preparer | Supersonic Fast Cash',
};

export default function CareersApplyPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-training-hero.jpg"
        alt="Apply to become a tax preparer"
        title="Apply to Become a Tax Preparer"
        subtitle="Join our team of professional tax preparers serving Indianapolis and the Midwest."
      />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <div className="bg-brand-blue-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-black mb-3">Start Your Application</h2>
          <p className="text-blue-200 leading-relaxed mb-6">
            To apply for a tax preparer position with Supersonic Fast Cash, email us your resume and a
            brief introduction, or give us a call. We typically respond within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:careers@supersonicfastcash.com"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Email Your Resume
            </a>
            <a
              href="tel:3173143757"
              className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Call (317) 314-3757
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What We Look For</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'Attention to detail and strong math skills',
              'Good communication and client service skills',
              'Willingness to complete 40 hours of paid training',
              'Clean background check',
              'Commitment to client confidentiality',
              'PTIN registration (or willingness to obtain one)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What You&apos;ll Earn</h2>
          <p className="text-slate-600 leading-relaxed">
            Tax preparers are compensated on a per-return basis. Experienced preparers typically complete
            4–8 returns per day during tax season (January–April). Training is paid. There is opportunity
            to grow into a sub-office agreement after your first filing season.
          </p>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/training"
            className="text-brand-red-600 hover:underline font-semibold"
          >
            Learn about our training program →
          </Link>
        </div>
      </div>
    </>
  );
}
