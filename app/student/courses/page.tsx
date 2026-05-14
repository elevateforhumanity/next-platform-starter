import { permanentRedirect } from 'next/navigation';

export default function StudentCoursesPage() {
  permanentRedirect('/lms/courses');
}
