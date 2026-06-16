import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Users, DollarSign, Clock, Shield, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'WIOA Eligibility Check | Elevate for Humanity',
  description: 'Check if you qualify for WIOA-funded training programs. WIOA helps job seekers access training and employment services.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/wioa-check' },
};

export default function WioaCheckPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Funding', href: '/funding' },
            { label: 'WIOA Eligibility' }
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-blue-500/20 text-brand-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" />
            WIOA Program
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            WIOA Eligibility Check
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Find out if you qualify for WIOA-funded training and employment services.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What is WIOA?</h2>
            <p className="text-slate-600 mb-4">
              The Workforce Innovation and Opportunity Act (WIOA) provides funding for job training 
              and employment services for eligible individuals. This can help cover the cost of 
              our barber apprenticeship program.
            </p>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4">You may qualify if you are:</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Unemployed</h4>
                  <p className="text-sm text-slate-600">Currently looking for work</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Underemployed</h4>
                  <p className="text-sm text-slate-600">Working but seeking better opportunities</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Dislocated Worker</h4>
                  <p className="text-sm text-slate-600">Lost job due to layoffs or business closure</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Low-Income Individual</h4>
                  <p className="text-sm text-slate-600">Meeting income eligibility requirements</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Benefits of WIOA Funding</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-brand-blue-500" />
                Financial assistance for training costs
              </li>
              <li className="flex items-center gap-3">
                <Users className="w-5 h-5 text-brand-blue-500" />
                Career counseling and job placement support
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-brand-blue-500" />
                Access to additional workforce services
              </li>
            </ul>
          </div>

          <div className="bg-brand-blue-600 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Eligibility</h2>
            <p className="text-blue-100 mb-6">
              Visit your local WorkOne career center to determine if you qualify for WIOA funding.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/wioa-eligibility" className="inline-flex items-center bg-white text-brand-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition-colors">
                Complete Eligibility Form
              </Link>
              <Link href="/find-workone" className="inline-flex items-center border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-6 rounded-lg transition-colors">
                Find WorkOne Center
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}