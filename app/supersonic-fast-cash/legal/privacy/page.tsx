export const dynamic = 'force-static';
export const revalidate = 86400;

import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Privacy Policy | Supersonic Fast Cash',
};

const sections = [
  {
    title: 'What We Collect',
    content:
      'We collect information necessary to prepare your tax return, including your name, Social Security Number, date of birth, contact information, income documents, bank account information for direct deposit, and prior-year tax returns when applicable. We collect this information directly from you.',
  },
  {
    title: 'How We Use Your Information',
    content:
      'Your information is used exclusively to prepare and electronically file your tax returns, communicate with you about your return status, and comply with IRS and state regulatory requirements. We do not use your data for advertising, profiling, or any purpose unrelated to your tax filing.',
  },
  {
    title: 'Third-Party Sharing',
    content:
      'We do not sell, rent, or trade your personal information to third parties for their own use. We may share your information with the IRS and applicable state tax agencies as required to file your return. We may also share information with service providers who assist us in operating our business, under strict confidentiality agreements.',
  },
  {
    title: 'Data Retention',
    content:
      'We retain client tax records for a minimum of three (3) years as required by IRS regulations under IRC § 7216. After the required retention period, records are securely deleted. You may request deletion of your data at any time, subject to our legal retention obligations.',
  },
  {
    title: 'Your Rights',
    content:
      'You have the right to access your personal data, request corrections, request deletion (subject to retention requirements), and withdraw consent for future services. To exercise these rights, contact us using the information below.',
  },
  {
    title: 'Contact Information',
    content:
      'For privacy-related requests or questions, contact Supersonic Fast Cash LLC at info@supersonicfastcash.com or (317) 314-3757. We respond to all privacy requests within 5 business days.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Privacy policy"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your information."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-10">
        <p className="text-slate-500 text-sm">Effective Date: January 1, 2024</p>

        {sections.map(({ title, content }) => (
          <section key={title}>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
            <p className="text-slate-600 leading-relaxed">{content}</p>
          </section>
        ))}

        <div className="border-t border-slate-200 pt-8">
          <p className="text-slate-500 text-sm">
            Questions about this policy? Contact us at{' '}
            <a href="mailto:info@supersonicfastcash.com" className="text-brand-red-600 hover:underline">
              info@supersonicfastcash.com
            </a>{' '}
            or call{' '}
            <a href="tel:3173143757" className="text-brand-red-600 hover:underline">
              (317) 314-3757
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
