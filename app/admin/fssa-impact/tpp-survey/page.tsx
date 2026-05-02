import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TppSurveyClient from './TppSurveyClient';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TPP Questionnaire | FSSA SNAP E&T | Admin',
};

export default async function TppSurveyPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'FSSA SNAP E&T', href: '/admin/fssa-impact' },
              { label: 'TPP Questionnaire' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/fssa-impact" className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">FSSA TPP Questionnaire</h1>
            <p className="text-sm text-slate-500">Third Party Provider application — Indiana SNAP E&T (IMPACT) program</p>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-xs text-blue-700">
          Complete this survey to prepare your FSSA DFR Third Party Provider application. Save your responses here, then use them to fill out the official FSSA portal submission. All fields are pre-populated with Elevate's information — update as needed.
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <TppSurveyClient />
        </div>
      </div>
    </div>
  );
}
