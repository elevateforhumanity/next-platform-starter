import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PartnerShopForm from '../PartnerShopForm';

export const metadata: Metadata = {
  title: 'Partner Salon Application | Elevate for Humanity',
  description:
    'Apply to host cosmetology apprentices at your salon through the Elevate for Humanity DOL-registered apprenticeship program.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship/apply/partner-salon' },
};

export default function CosmetologyPartnerSalonApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
              { label: 'Apply', href: '/programs/cosmetology-apprenticeship/apply' },
              { label: 'Partner Salon' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">
            Partner Salon Application
          </h1>
          <p className="text-slate-600 mt-1">
            Apply to host cosmetology apprentices at your salon.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <PartnerShopForm />
      </div>
    </div>
  );
}
