import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function RiseLegacyPage() {
  permanentRedirect('/tax');
}
