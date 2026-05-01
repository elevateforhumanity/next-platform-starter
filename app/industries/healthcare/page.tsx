import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// /industries/healthcare was a legacy DB-driven page.
// Canonical student-facing page is /programs/healthcare.
// Employer/industry-focused content will live at /partners/healthcare when built.
export default function Page() {
  redirect('/programs/healthcare');
}
