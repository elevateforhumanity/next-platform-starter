import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo',
  alternates: { canonical: 'https://www.elevateforhumanity.org/start/demo' },
  robots: { index: false, follow: false },
};

export default function Page() { redirect('/start/demo'); }
