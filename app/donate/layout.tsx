import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Donate | Elevate for Humanity',
  description:
    'Support free career training, industry credentials, and job placement for underserved communities. Your donation funds a workforce revolution.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/donate',
  },
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
