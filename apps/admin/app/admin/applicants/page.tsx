import { redirect } from 'next/navigation';

// Applicants list is managed under Applications
export default function ApplicantsPage() {
  redirect('/admin/applications');
}
