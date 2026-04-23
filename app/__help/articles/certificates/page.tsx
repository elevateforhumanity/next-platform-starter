import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, Download, Share2, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certificates & Credentials | Help Center | Elevate for Humanity',
  description: 'Learn how to earn, download, and share your Elevate certificates and industry credentials.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/certificates' },
};

const STEPS = [
  { step: '1', title: 'Complete all lessons', desc: 'Work through every lesson in your program. Each lesson must be marked complete before the next unlocks.' },
  { step: '2', title: 'Pass all checkpoints', desc: 'Each module ends with a checkpoint quiz. You need a passing score (typically 70%) to advance to the next module.' },
  { step: '3', title: 'Pass the final exam', desc: 'The final exam covers the full program. A passing score triggers automatic certificate generation.' },
  { step: '4', title: 'Download your certificate', desc: 'Your certificate appears in your learner dashboard under "My Credentials." Download as PDF or share a verification link.' },
];

const FAQS = [
  { q: 'How long does it take to receive my certificate?', a: 'Certificates are generated automatically within minutes of passing your final exam. You will receive an email with a download link.' },
  { q: 'Can employers verify my certificate?', a: 'Yes. Every certificate has a unique verification URL (e.g., elevateforhumanity.org/verify/[id]) that employers can visit to confirm authenticity.' },
  { q: 'What if I fail the final exam?', a: 'You can retake the exam after a 24-hour waiting period. Review the lesson content and checkpoint feedback before retaking.' },
  { q: 'Is my Elevate certificate the same as the industry credential?', a: 'Your Elevate completion certificate confirms you finished the program. For programs with a third-party credential (e.g., NHA CCMA, EPA 608), you will receive separate instructions to schedule and sit the external exam.' },
  { q: 'Can I share my certificate on LinkedIn?', a: 'Yes. From your credentials dashboard, click "Share" to get a LinkedIn-compatible link or download the PDF to upload directly.' },
  { q: 'My certificate shows the wrong name. How do I fix it?', a: 'Contact support at support@elevateforhumanity.org with your legal name and enrollment ID. We will reissue the certificate within 2 business days.' },
];

export default function CertificatesHelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Link href="/help" className="hover:text-slate-700">Help Center</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/help/articles" className="hover:text-slate-700">Articles</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">Certificates</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full">Certificates & Credentials</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mt-4 mb-3">How to earn and use your certificate</h1>
        <p className="text-slate-600 mb-10">Elevate issues completion certificates automatically when you finish a program. Here is how the process works and what to do with your credential.</p>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Earning your certificate</h2>
          <div className="space-y-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 p-5 border border-slate-200 rounded-xl">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{step}</div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-600 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 bg-amber-50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">What you can do with your certificate</h2>
          <div className="space-y-3">
            {[
              { icon: Download, text: 'Download as PDF — print or attach to job applications' },
              { icon: Share2, text: 'Share a public verification link with employers or schools' },
              { icon: CheckCircle, text: 'Add to your LinkedIn profile under Licenses & Certifications' },
              { icon: Award, text: 'Use as proof of completion for WIOA reimbursement or employer tuition assistance' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-slate-700 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-slate-900 mb-1">{q}</p>
                <p className="text-slate-600 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border border-slate-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-slate-900 mb-1">Still have questions?</p>
          <p className="text-slate-600 text-sm mb-4">Our support team responds within 1 business day.</p>
          <Link href="/contact" className="inline-block bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
