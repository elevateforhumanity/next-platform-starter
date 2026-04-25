import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Server } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Security & Data Protection | Elevate for Humanity',
  description: 'How Elevate for Humanity protects your personal data, student records, and financial information.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/security-and-data-protection' },
};

const PRACTICES = [
  {
    icon: Lock,
    title: 'Encryption in transit and at rest',
    body: 'All data transmitted to and from our platform is encrypted using TLS 1.2+. Student records and personal information are encrypted at rest.',
  },
  {
    icon: ShieldCheck,
    title: 'Access controls',
    body: 'Role-based access controls limit who can view student data. Staff access is logged and reviewed. Students can only access their own records.',
  },
  {
    icon: Eye,
    title: 'Data minimization',
    body: 'We collect only the data required to deliver your program and comply with funding agency reporting requirements. We do not sell student data.',
  },
  {
    icon: Server,
    title: 'Infrastructure security',
    body: 'Our platform runs on SOC 2-compliant infrastructure. We conduct regular security reviews and vulnerability assessments.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Trust & Safety</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Security & Data Protection</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            We take the security of your personal information seriously. This page explains how we protect student data, financial records, and platform access.
          </p>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Our security practices</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {PRACTICES.map((p) => (
              <div key={p.title} className="border border-slate-200 rounded-xl p-6">
                <p.icon className="w-6 h-6 text-brand-red-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">FERPA compliance</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
            Elevate for Humanity complies with the Family Educational Rights and Privacy Act (FERPA). Students have the right to inspect their education records, request corrections, and control disclosure of their records to third parties.
          </p>
          <Link href="/ferpa" className="text-brand-red-600 hover:underline text-sm font-bold mt-4 inline-block">FERPA Rights & Policy →</Link>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Report a security concern</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mb-6">
            If you believe you have found a security vulnerability or have a concern about how your data is being handled, contact us immediately.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Contact Security Team</Link>
            <Link href="/privacy-policy" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Privacy Policy</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
