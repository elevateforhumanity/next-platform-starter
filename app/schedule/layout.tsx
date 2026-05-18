import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'Schedule a meeting with the Elevate for Humanity team to discuss enrollment, funding eligibility, or program options.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/schedule',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
