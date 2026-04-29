import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { MEDICAL_ASSISTANT } from '@/data/programs/medical-assistant';
import heroBanners from '@/content/heroBanners';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: MEDICAL_ASSISTANT.metaTitle ?? `${MEDICAL_ASSISTANT.title} | Elevate for Humanity`,
  description: MEDICAL_ASSISTANT.metaDescription ?? MEDICAL_ASSISTANT.subtitle,
  alternates: { canonical: '/programs/medical-assistant' },
  openGraph: {
    title: 'Medical Assistant | Elevate for Humanity',
    description: 'NHA CCMA certification. Clinical and administrative training. WIOA and FSSA funding available.',
    url: 'https://www.elevateforhumanity.org/programs/medical-assistant',
    siteName: 'Elevate for Humanity',
    images: [{ url: 'https://www.elevateforhumanity.org/images/pages/programs-medical-apply-hero.jpg', width: 1200, height: 630, alt: 'Medical Assistant' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medical Assistant | Elevate for Humanity',
    description: 'NHA CCMA certification. Clinical and administrative training. WIOA and FSSA funding available.',
    images: ['https://www.elevateforhumanity.org/images/pages/programs-medical-apply-hero.jpg'],
  },
};

export default function Page() {
  const banner = heroBanners['medical-assistant'] ?? null;
  return <ProgramDetailPage program={MEDICAL_ASSISTANT} banner={banner} />;
}
