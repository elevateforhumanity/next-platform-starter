import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, DollarSign, ShieldCheck, BookOpen } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Consumer Education | Elevate for Humanity',
  description: 'Know your rights as a student. Understand tuition, refund policies, program outcomes, and how to file a complaint.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/consumer-education' },
};

const SECTIONS = [
  {
    icon: DollarSign,
    title: 'Tuition & Fees',
    body: 'All program costs are disclosed before enrollment. We provide a written enrollment agreement that itemizes tuition, fees, and any additional costs. No hidden charges.',
    links: [{ label: 'View Tuition & Fees', href: '/funding' }],
  },
  {
    icon: FileText,
    title: 'Refund Policy',
    body: 'Students who withdraw within the first week receive a full refund. Pro-rated refunds apply through the first 60% of the program. After 60% completion, no refund is issued.',
    links: [{ label: 'Full Refund Policy', href: '/policies/refund' }],
  },
  {
    icon: BookOpen,
    title: 'Program Outcomes',
    body: 'We publish completion rates, credential attainment rates, and employment outcomes for each program. Review outcomes data before enrolling.',
    links: [{ label: 'View Outcomes Data', href: '/outcomes/indiana' }],
  },
  {
    icon: ShieldCheck,
    title: 'Complaint Process',
    body: 'If you have a concern about your program or experience, contact us first. Unresolved complaints may be submitted to the Indiana Commission for Higher Education or your funding agency.',
    links: [{ label: 'Contact Us', href: '/contact' }, { label: 'File a Complaint', href: '/contact' }],
  },
];

export default function ConsumerEducationPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Student Rights</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Consumer Education</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Before you enroll, you have the right to know exactly what you're paying for, what outcomes to expect, and what to do if something goes wrong.
          </p>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title} className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <s.icon className="w-6 h-6 text-brand-red-600" />
                <h2 className="text-lg font-extrabold text-slate-900">{s.title}</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{s.body}</p>
              <div className="flex flex-wrap gap-3">
                {s.links.map((l) => (
                  <Link key={l.label} href={l.href} className="text-brand-red-600 hover:underline text-sm font-bold">{l.label} →</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Questions before you enroll?</h2>
          <p className="text-slate-600 text-sm mb-6">Our enrollment advisors can walk you through costs, funding options, and what to expect from your program.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Talk to an Advisor</Link>
            <Link href="/check-eligibility" className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Check Eligibility</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
