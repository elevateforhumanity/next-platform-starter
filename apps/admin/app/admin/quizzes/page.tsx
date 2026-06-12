import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

// Quiz management is now part of Dev Studio.
export default function QuizzesPage() {
  redirect('/admin/dev-studio?tab=courses');
}
