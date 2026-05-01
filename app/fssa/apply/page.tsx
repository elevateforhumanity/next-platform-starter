import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Redirect legacy /fssa/apply path to the canonical application page.
export default function FssaApplyRedirect() {
  redirect('/apply/fssa');
}
