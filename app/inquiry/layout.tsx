import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Your Application',
  description:
    'Begin your application for career training programs at Elevate for Humanity. Funding may be available through WIOA, grants, or employer sponsorship.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/inquiry',
  },
};

export default function InquiryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
