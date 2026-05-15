import { permanentRedirect } from 'next/navigation';

export default function StudentAssignmentsPage() {
  permanentRedirect('/lms/assignments');
}
