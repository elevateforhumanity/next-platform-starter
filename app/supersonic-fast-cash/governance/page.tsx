import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Governance & Compliance Overview | Supersonic Fast Cash',
};

const links = [
  { href: '/supersonic-fast-cash/governance/compliance', label: 'Tax Compliance Standards', desc: 'PTIN requirements, IRS e-file authorization, state registration' },
  { href: '/supersonic-fast-cash/governance/security', label: 'Security Standards', desc: '256-bit encryption, data handling, and secure server policies' },
  { href: '/supersonic-fast-cash/governance/authoritative-docs', label: 'Authoritative Documents', desc: 'IRS Circular 230, PTIN requirements, and governing regulations' },
  { href: '/supersonic-fast-cash/governance/operational-controls', label: 'Operational Controls', desc: 'Preparer oversight, quality review, and error correction policy' },
  { href: '/supersonic-fast-cash/contact', label: 'Contact Us', desc: 'Reach our compliance team directly' },
];

export default function GovernancePage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Governance and compliance"
        title="Governance & Compliance Overview"
        subtitle="Supersonic Fast Cash operates under IRS regulations, Indiana state law, and industry best practices."
      />

      <div className="max-w-4xl mx-auto px-4 py-14">
        <p className="text-slate-600 leading-relaxed mb-10 text-lg">
          As an IRS Authorized e-File Provider and licensed tax preparation firm operating in Indiana,
          Supersonic Fast Cash LLC maintains rigorous compliance standards across all aspects of our
          business. Select a topic below to learn more.
        </p>

        <div className="space-y-4">
          {links.map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="block border border-slate-200 hover:border-brand-red-600 rounded-xl px-6 py-5 transition-colors group"
            >
              <p className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors mb-1">
                {label}
              </p>
              <p className="text-slate-500 text-sm">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
