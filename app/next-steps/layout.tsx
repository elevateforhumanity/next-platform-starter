import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Next Steps | Elevate for Humanity',
  description:
    'Your personalized checklist for completing enrollment, submitting documents, and starting your career training program at Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/next-steps',
  },
  robots: { index: false },
};

export default function NextStepsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
