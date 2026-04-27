import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Elevate for Humanity',
  description:
    'Contact Elevate for Humanity for program applications, enrollment support, partnerships, employer hiring, and workforce training questions.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
