export const dynamic = 'force-static';
export const revalidate = 86400;

import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Terms of Service | Supersonic Fast Cash',
};

const sections = [
  {
    title: 'Service Description',
    content:
      'Supersonic Fast Cash LLC provides professional tax preparation, electronic filing, and related financial services. Services include preparation of federal and state income tax returns, review of prior-year returns, and consultation on tax-related matters. We are an IRS Authorized e-File Provider.',
  },
  {
    title: 'User Responsibilities',
    content:
      'Clients are responsible for providing accurate, complete, and truthful information. Supersonic Fast Cash is not liable for errors resulting from incomplete or incorrect information provided by the client. You agree not to use our services for any unlawful purpose, including the filing of fraudulent returns.',
  },
  {
    title: 'Payment Terms',
    content:
      'Tax preparation fees are due at the time of service, prior to e-file submission of your return. Accepted payment methods include cash, debit cards, credit cards, and bank transfer. Fees vary based on the complexity of your return and will be disclosed prior to preparation.',
  },
  {
    title: 'Refund Policy',
    content:
      'Preparation fees are non-refundable once your return has been prepared and reviewed with you. If an error is found that was caused by our preparer, we will amend your return at no additional cost. We do not guarantee any specific refund amount from the IRS or state tax authorities.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'Supersonic Fast Cash LLC\'s liability is limited to the amount paid for the preparation services in question. We are not liable for IRS penalties or interest resulting from information you provided, nor for changes in tax law that occur after preparation. We strongly recommend retaining copies of all documents.',
  },
  {
    title: 'Governing Law',
    content:
      'These Terms of Service are governed by the laws of the State of Indiana. Any disputes arising from these terms shall be resolved in the courts of Marion County, Indiana.',
  },
];

export default function TermsPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Terms of service"
        title="Terms of Service"
        subtitle="Please read these terms carefully before using our services."
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
            If you have questions about these terms, contact us at{' '}
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
