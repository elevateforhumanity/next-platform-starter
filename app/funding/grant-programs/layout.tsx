import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Funding | Grant programs',
  description: 'Browse WIOA, Workforce Ready Grant, and JRI-funded career training programs available through Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/grant-programs',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
