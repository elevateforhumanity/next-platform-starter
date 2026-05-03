import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Award, ArrowRight, CheckCircle, Building2, ClipboardList } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Certification & Credentialing | Elevate for Humanity',
  description: 'Industry-recognized certifications through Elevate for Humanity. NHA, EPA 608, CDL, CompTIA, and more. Testing coordinated through approved certifying bodies.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/certification' },
};

const certs = [
  {
    program: 'CNA / Nursing Assistant',
    body: 'Indiana State Department of Health (ISDH)',
    exam: 'Indiana Nurse Aide Competency Evaluation',
    href: '/programs/cna',
  },
  {
    program: 'HVAC Technician',
    body: 'EPA / ESCO Institute',
    exam: 'EPA 608 Universal Certification',
    href: '/programs/hvac-technician',
  },
  {
    program: 'Phlebotomy Technician',
    body: 'National Healthcareer Association (NHA)',
    exam: 'Certified Phlebotomy Technician (CPT)',
    href: '/programs/phlebotomy',
  },
  {
    program: 'Medical Assistant',
    body: 'National Healthcareer Association (NHA)',
    exam: 'Certified Clinical Medical Assistant (CCMA)',
    href: '/programs/medical-assistant',
  },
  {
    program: 'CDL Training',
    body: 'Indiana BMV / FMCSA',
    exam: 'Commercial Driver License (CDL-A or CDL-B)',
    href: '/programs/cdl-training',
  },
  {
    program: 'Cosmetology / Barbering',
    body: 'Indiana Professional Licensing Agency (IPLA)',
    exam: 'Indiana State Board Exam',
    href: '/programs/cosmetology-apprenticeship',
  },
  {
    program: 'IT Certifications',
    body: 'CompTIA / Certiport',
    exam: 'CompTIA A+, Network+, Security+',
    href: '/programs/it-certifications',
  },
];

const process = [
  { n: '1', title: 'Complete Your Program', desc: 'Finish all required coursework and clinical/lab hours.' },
  { n: '2', title: 'Exam Authorization', desc: 'Elevate coordinates exam registration with the certifying body.' },
  { n: '3', title: 'Testing', desc: 'Sit for your exam at an approved testing center or proctored location.' },
  { n: '4', title: 'Credential Issued', desc: 'Your credential is issued by the certifying body and recorded in your Elevate profile.' },
  { n: '5', title: 'Verification', desc: 'Employers can verify your credential at elevateforhumanity.org/verify.' },
];

export default function CertificationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Certification' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Credentials & Certification</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">
            Industry-Recognized Credentials
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Every Elevate program leads to a nationally or state-recognized credential. We coordinate testing through approved certifying bodies so you can focus on passing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/programs" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              View Programs
            </Link>
            <Link href="/verify" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Verify a Credential
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications Table */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Certifications by Program
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-bold text-slate-700">Program</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-700">Certifying Body</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-700">Credential</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certs.map((c) => (
                  <tr key={c.program} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900">{c.program}</td>
                    <td className="px-5 py-4 text-slate-600">{c.body}</td>
                    <td className="px-5 py-4 text-slate-600">{c.exam}</td>
                    <td className="px-5 py-4">
                      <Link href={c.href} className="text-amber-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            From Training to Credential
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {process.map((s) => (
              <div key={s.n} className="flex gap-4 p-5 rounded-2xl border border-slate-200 bg-white">
                <span className="w-9 h-9 rounded-full bg-amber-500 text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Verification</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">
            Credentials Employers Can Trust
          </h2>
          <p className="text-slate-600 text-sm text-center max-w-xl mx-auto mb-10">
            Every credential issued through Elevate is verifiable online. Employers can confirm authenticity in seconds.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Award, title: 'Nationally Recognized', desc: 'Credentials issued by NHA, CompTIA, EPA, FMCSA, and state licensing boards.' },
              { icon: Building2, title: 'ETPL Listed', desc: 'Elevate programs appear on Indiana\'s Eligible Training Provider List (ETPL).' },
              { icon: ClipboardList, title: 'Instant Verification', desc: 'Employers verify credentials at elevateforhumanity.org/verify using a certificate ID.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6 text-center">
                <Icon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="font-extrabold text-slate-900 text-base mb-2">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-600 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Earn Your Credential?</h2>
          <p className="text-amber-100 text-sm mb-8">
            Apply to a program today. Funding may be available through WIOA, WRG, or FSSA.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-white text-amber-700 font-bold px-8 py-3.5 rounded-lg hover:bg-amber-50 transition-colors text-sm">
              Apply Now
            </Link>
            <Link href="/verify" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Verify a Credential
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
