import { redirect } from 'next/navigation';

// Quiz management is now part of the Studio.
// /admin/quizzes → /admin/studio (select a course to manage its quizzes)
export default function QuizzesPage() {
  redirect('/admin/studio');
}
