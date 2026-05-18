import { permanentRedirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Platform documentation and help resources.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/help',
  },
  robots: { index: false, follow: false },
};

// Redirect to help page
export default function DocumentationPage() {
  permanentRedirect('/help');
}
