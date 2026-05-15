import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// After payment plan setup, show the enrollment-success page which has all next steps.
export const dynamic = 'force-dynamic';

export default function CosmoOrientationPage() {
  redirect('/programs/cosmetology-apprenticeship/enrollment-success');
}
