import { permanentRedirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
// Moved to supersonicfastermoney.com
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export default function Page() {
  permanentRedirect('https://www.supersonicfastermoney.com/tax');
}
