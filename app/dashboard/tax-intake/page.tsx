import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// VITA tax intake consolidated into admin dashboard.
export default function TaxIntakePage() {
  redirect('/admin/dashboard');
}
