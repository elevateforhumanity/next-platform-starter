import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Tax Self-Prep',
  robots: { index: false, follow: false },
};

// Moved to supersonicfastermoney.com
export default function Page() {
  permanentRedirect('https://www.supersonicfastermoney.com/tax-self-prep');
}
