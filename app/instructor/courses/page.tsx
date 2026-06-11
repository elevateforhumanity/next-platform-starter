import { redirect } from 'next/navigation';

export default function RedirectPage() {
  redirect('/admin/instructor/courses');
}
