import { redirect } from 'next/navigation';

// AI builder chat is embedded in the course builder
export default function Page() {
  redirect('/admin/course-builder');
}
