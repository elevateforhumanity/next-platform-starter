import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

// Client components — lazy-loaded to keep server bundle lean
const CprHero = dynamic(() => import('@/components/programs/CprHero'));
const CprPageBlocks = dynamic(() => import('@/components/programs/CprPageBlocks'));

export const metadata: Metadata = {
  title: 'CPR & First Aid Certification | At-Home Training | Elevate for Humanity',
  description:
    'Get CPR and First Aid certified from home. A training mannequin ships to your door. Live instructor-led session. Same-day certification card. $130 — or free with any Elevate program enrollment.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cpr-first-aid' },
  openGraph: {
    title: 'CPR & First Aid Certification | Elevate for Humanity',
    description:
      'Train from home with a shipped mannequin and live instructor. Same-day certification card.',
    images: [{ url: '/images/pages/programs-cpr-hero.webp', width: 1200, height: 630 }],
  },
};

export default function CprFirstAidPage() {
  // PUBLIC ROUTE: program marketing page — no auth required.
  return (
    <div className="min-h-screen bg-white" id="details">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Micro Programs', href: '/programs/micro-programs' },
              { label: 'CPR & First Aid' },
            ]}
          />
        </div>
      </div>

      <CprHero />
      <CprPageBlocks />
    </div>
  );
}
