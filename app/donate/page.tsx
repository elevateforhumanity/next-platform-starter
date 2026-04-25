import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Users, GraduationCap, Briefcase } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Donate | Support Workforce Training | Elevate for Humanity',
  description: 'Your donation funds scholarships, equipment, and career support for adults pursuing workforce credentials in Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/donate' },
};

const IMPACT = [
  { icon: GraduationCap, amount: '$250', label: 'Covers exam fees for one student' },
  { icon: Users,         amount: '$500', label: 'Funds one month of career coaching' },
  { icon: Briefcase,     amount: '$1,000', label: 'Sponsors a full scholarship for one student' },
  { icon: Heart,         amount: 'Any amount', label: 'Supports tools, materials, and student support services' },
];

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Support Our Mission</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Donate to Elevate for Humanity</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Elevate for Humanity is a nonprofit workforce development organization. Your donation directly funds scholarships, equipment, and career support for adults pursuing high-demand credentials.
          </p>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Your impact</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {IMPACT.map((item) => (
              <div key={item.amount} className="border border-slate-200 rounded-xl p-6 flex items-start gap-4">
                <item.icon className="w-8 h-8 text-brand-red-600 shrink-0" />
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{item.amount}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Make a donation</h2>
          <p className="text-slate-600 text-sm mb-8">
            Elevate for Humanity is a 501(c)(3) nonprofit organization. All donations are tax-deductible to the extent permitted by law.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 mb-6">
            <p className="text-slate-700 text-sm mb-6">To make a donation, please contact us directly. We accept checks, ACH transfers, and credit card payments.</p>
            <Link href="/contact" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors text-sm inline-block">Contact Us to Donate</Link>
          </div>
          <p className="text-xs text-slate-400">Elevate for Humanity · Indianapolis, Indiana · EIN available upon request</p>
        </div>
      </section>
    </div>
  );
}
