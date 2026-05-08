import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// ARCHIVED: FSSA apply path is retired for now.
export default function FssaApplyRedirect() {
  redirect('/apply');
}
