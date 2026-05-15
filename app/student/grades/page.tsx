import { permanentRedirect } from 'next/navigation';

export default function StudentGradesPage() {
  permanentRedirect('/lms/grades');
}
