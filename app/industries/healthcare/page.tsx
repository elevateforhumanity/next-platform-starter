import { redirect } from 'next/navigation';

// /industries/healthcare was a legacy DB-driven page.
// Canonical student-facing page is /programs/healthcare.
// Employer/industry-focused content will live at /partners/healthcare when built.
export default function Page() {
  redirect('/programs/healthcare');
}
