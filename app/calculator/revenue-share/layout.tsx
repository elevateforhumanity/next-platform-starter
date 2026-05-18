import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Revenue Share Calculator',
  description: 'Estimate revenue share projections for Elevate for Humanity licensing and partnership arrangements.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/calculator/revenue-share',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
