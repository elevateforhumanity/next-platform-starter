import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { QMA } from '@/data/programs/qma';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Qualified Medication Aide (QMA) Training | Elevate for Humanity',
  description:
    'Indiana QMA certification in 5 weeks. Administer medications in long-term care. FSSA IMPACT and WIOA funding available for eligible Indiana residents.',
  alternates: { canonical: '/programs/qma' },
  openGraph: {
    title: 'Qualified Medication Aide (QMA) | Elevate for Humanity',
    description:
      'Indiana ISDH-approved QMA credential in 5 weeks. 100 hours of classroom and clinical training. FSSA IMPACT and WIOA funding available.',
    url: 'https://www.elevateforhumanity.org/programs/qma',
    siteName: 'Elevate for Humanity',
    images: [
      {
        url: 'https://www.elevateforhumanity.org/images/pages/medical-assistant-lab.jpg',
        width: 1200,
        height: 630,
        alt: 'Qualified Medication Aide training',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qualified Medication Aide (QMA) | Elevate for Humanity',
    description:
      'Indiana QMA certification in 5 weeks. FSSA IMPACT and WIOA funding available.',
    images: ['https://www.elevateforhumanity.org/images/pages/medical-assistant-lab.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['qma'] ?? null;
  return <ProgramDetailPage program={QMA} banner={banner} />;
}
