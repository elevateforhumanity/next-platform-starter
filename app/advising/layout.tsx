import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Career Advising | Elevate for Humanity',
  description:
    'Talk with an Elevate for Humanity advisor about program options, funding eligibility, and your next steps toward a new career.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/advising',
  },
};

export default function AdvisingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
